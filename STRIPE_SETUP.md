# Stripe + Supabase Setup Guide

## 1. Stripe Dashboard Setup

### Create Product & Price
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Products → Add Product
   - Name: `Highlight Pro`
   - Description: `Cloud sync, unlimited exports, Notion export`
3. Add a price:
   - Price: `€2.00`
   - Billing period: `Monthly`
   - Copy the `price_id` (starts with `price_...`)

### Configure Customer Portal
1. Settings → Billing → Customer Portal
2. Enable:
   - Cancel subscription
   - Update payment method
   - View invoices
3. Set return URL: `https://kindle-swipe.netlify.app/settings`

### Get API Keys
1. Developers → API Keys
2. Copy:
   - Publishable key (`pk_live_...` or `pk_test_...`)
   - Secret key (`sk_live_...` or `sk_test_...`)

## 2. Supabase Setup

### Run Database Migration
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/20250124_add_subscriptions.sql`
3. Run the query

### Deploy Edge Functions
```bash
# Install Supabase CLI if needed
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook
supabase functions deploy create-portal-session
```

### Set Secrets
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set STRIPE_PRICE_ID=price_...
```

## 3. Stripe Webhook Setup

1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint:
   - URL: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
   - Events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
     - `invoice.payment_succeeded`
3. Copy the webhook signing secret (`whsec_...`)
4. Add to Supabase secrets (see above)

## 4. Environment Variables

### Local Development (.env)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_PRICE_ID=price_...
```

### Netlify
Add these in Netlify → Site Settings → Environment Variables:
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_STRIPE_PRICE_ID`

(Supabase vars should already be there)

## 5. Testing

### Test Flow
1. Create account in app
2. Go to Settings → Upgrade to Pro
3. Use Stripe test card: `4242 4242 4242 4242`
4. Complete checkout
5. Verify subscription appears in Settings
6. Test export limits (should be unlimited now)

### Stripe CLI (local testing)
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local Supabase
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

## Files Created

```
supabase/
  migrations/
    20250124_add_subscriptions.sql   # Database schema
  functions/
    create-checkout/index.ts          # Creates Stripe checkout session
    stripe-webhook/index.ts           # Handles Stripe events
    create-portal-session/index.ts    # Opens customer portal

src/
  hooks/useSubscription.js            # Subscription state management
  components/UpgradeModal.jsx         # Upgrade prompt UI
```

## Files Modified

```
src/App.jsx                           # Added subscription hook
src/components/QuoteExport.jsx        # Export limit gating
src/components/SettingsPanel.jsx      # Subscription management UI
```
