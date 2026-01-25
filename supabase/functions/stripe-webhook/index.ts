import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

// Use service role for webhook - needs to bypass RLS
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  const body = await req.text()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  console.log('Received event:', event.type)

  // Helper to update subscription in database
  const updateSubscription = async (subscription: Stripe.Subscription) => {
    const userId = subscription.metadata.supabase_user_id
    if (!userId) {
      console.error('No supabase_user_id in subscription metadata')
      return
    }

    // Map Stripe status to our status
    let status = 'free'
    let plan = 'free'

    if (subscription.status === 'active' || subscription.status === 'trialing') {
      status = 'active'
      plan = 'pro'
    } else if (subscription.status === 'past_due') {
      status = 'past_due'
      plan = 'pro' // Still give access during grace period
    } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
      status = 'canceled'
      plan = 'free'
    }

    const { error } = await supabase.from('subscriptions').upsert({
      user_id: userId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      status,
      plan,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

    if (error) {
      console.error('Error updating subscription:', error)
    } else {
      console.log(`Updated subscription for user ${userId}: status=${status}, plan=${plan}`)
    }
  }

  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      console.log('Checkout completed for customer:', session.customer)

      // The subscription.created event will handle the actual update
      // But we can log it here for debugging
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        await updateSubscription(subscription)
      }
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      await updateSubscription(subscription)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata.supabase_user_id

      if (userId) {
        const { error } = await supabase.from('subscriptions').update({
          status: 'canceled',
          plan: 'free',
          stripe_subscription_id: null,
          updated_at: new Date().toISOString()
        }).eq('user_id', userId)

        if (error) {
          console.error('Error canceling subscription:', error)
        } else {
          console.log(`Canceled subscription for user ${userId}`)
        }
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      console.log('Payment failed for invoice:', invoice.id)

      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
        await updateSubscription(subscription)
      }
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      console.log('Payment succeeded for invoice:', invoice.id)

      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
        await updateSubscription(subscription)
      }
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
})
