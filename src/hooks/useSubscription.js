import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

const FREE_TIER_LIMITS = {
  exports: 3,
  extensionImports: 1
};

/**
 * Hook to manage subscription state and feature gating
 * @param {string|null} userId - The authenticated user's ID
 */
export function useSubscription(userId) {
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load subscription and usage data
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      setSubscription(null);
      setUsage(null);
      return;
    }

    async function loadSubscriptionData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch subscription and usage in parallel
        const [subResult, usageResult] = await Promise.all([
          supabase.from('subscriptions').select('*').eq('user_id', userId).single(),
          supabase.from('usage_limits').select('*').eq('user_id', userId).single()
        ]);

        // Handle subscription - might not exist yet
        if (subResult.error && subResult.error.code !== 'PGRST116') {
          console.error('Subscription fetch error:', subResult.error);
        }
        setSubscription(subResult.data || { status: 'free', plan: 'free' });

        // Handle usage - create if doesn't exist
        if (usageResult.error && usageResult.error.code === 'PGRST116') {
          // No usage record exists, create one
          const { data: newUsage } = await supabase
            .from('usage_limits')
            .insert({ user_id: userId, exports_used: 0, extension_imports_used: 0 })
            .select()
            .single();
          setUsage(newUsage || { exports_used: 0, extension_imports_used: 0 });
        } else if (usageResult.error) {
          console.error('Usage fetch error:', usageResult.error);
          setUsage({ exports_used: 0, extension_imports_used: 0 });
        } else {
          // Check if we need to reset monthly usage
          const lastReset = new Date(usageResult.data.last_reset_at);
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);

          if (lastReset < monthStart) {
            // Reset usage for new month
            const { data: resetUsage } = await supabase
              .from('usage_limits')
              .update({ exports_used: 0, last_reset_at: new Date().toISOString() })
              .eq('user_id', userId)
              .select()
              .single();
            setUsage(resetUsage || usageResult.data);
          } else {
            setUsage(usageResult.data);
          }
        }
      } catch (err) {
        console.error('Error loading subscription:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadSubscriptionData();

    // Subscribe to realtime updates for subscription changes
    const channel = supabase
      .channel(`subscription-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'subscriptions',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log('Subscription updated:', payload);
        setSubscription(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Derived state
  const isPro = subscription?.status === 'active' && subscription?.plan === 'pro';
  const exportsUsed = usage?.exports_used || 0;
  const exportsRemaining = isPro ? Infinity : Math.max(0, FREE_TIER_LIMITS.exports - exportsUsed);
  const canExport = isPro || exportsRemaining > 0;
  const extensionImportsUsed = usage?.extension_imports_used || 0;
  const canUseExtension = isPro || extensionImportsUsed < FREE_TIER_LIMITS.extensionImports;
  const cancelAtPeriodEnd = subscription?.cancel_at_period_end || false;
  const periodEnd = subscription?.current_period_end;

  // Increment export count after successful export
  const incrementExportCount = useCallback(async () => {
    if (!userId || isPro) return true;

    try {
      const newCount = exportsUsed + 1;
      const { error } = await supabase
        .from('usage_limits')
        .update({ exports_used: newCount })
        .eq('user_id', userId);

      if (error) throw error;

      setUsage(prev => ({ ...prev, exports_used: newCount }));
      return true;
    } catch (err) {
      console.error('Error incrementing export count:', err);
      return false;
    }
  }, [userId, isPro, exportsUsed]);

  // Increment extension import count
  const incrementExtensionImportCount = useCallback(async () => {
    if (!userId || isPro) return true;

    try {
      const newCount = extensionImportsUsed + 1;
      const { error } = await supabase
        .from('usage_limits')
        .update({ extension_imports_used: newCount })
        .eq('user_id', userId);

      if (error) throw error;

      setUsage(prev => ({ ...prev, extension_imports_used: newCount }));
      return true;
    } catch (err) {
      console.error('Error incrementing extension import count:', err);
      return false;
    }
  }, [userId, isPro, extensionImportsUsed]);

  // Create Stripe checkout session
  const createCheckoutSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error('Checkout error:', err);
      throw err;
    }
  }, []);

  // Open Stripe Customer Portal
  const openCustomerPortal = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } catch (err) {
      console.error('Portal error:', err);
      throw err;
    }
  }, []);

  return {
    // State
    subscription,
    usage,
    isLoading,
    error,

    // Derived state
    isPro,
    canExport,
    canUseExtension,
    exportsRemaining,
    exportsUsed,
    cancelAtPeriodEnd,
    periodEnd,

    // Actions
    incrementExportCount,
    incrementExtensionImportCount,
    createCheckoutSession,
    openCustomerPortal,

    // Constants
    FREE_TIER_LIMITS
  };
}
