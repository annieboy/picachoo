const express = require('express');
const router  = express.Router();
const pool        = require('../config/db');
const requireAuth = require('../middleware/requireAuth');

function getStripe() {
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// ── Helper: get or create Stripe customer ─────────────────────────────────────
async function resolveCustomer(stripe, host, email) {
  if (host.stripe_customer_id) return host.stripe_customer_id;
  const customer = await stripe.customers.create({
    email,
    metadata: { hostId: host.id },
  });
  await pool.query(
    `UPDATE hosts SET stripe_customer_id = $1 WHERE id = $2`,
    [customer.id, host.id],
  );
  return customer.id;
}

// ─── POST /api/stripe/checkout ────────────────────────────────────────────────
// Returns { clientSecret } for Stripe Elements — NOT a hosted redirect.
// body: { type: 'one_time_pass' | 'pro_annual' | 'business_annual', eventId? }
router.post('/checkout', requireAuth, async (req, res, next) => {
  try {
    const stripe = getStripe();
    const { type, eventId } = req.body ?? {};
    const { authId, email } = req.user;

    const VALID_TYPES = ['one_time_pass', 'pro_annual', 'business_annual'];
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Invalid checkout type' });
    }

    const { rows } = await pool.query(
      `SELECT id, stripe_customer_id FROM hosts WHERE auth_id = $1`,
      [authId],
    );
    if (!rows.length) return res.status(404).json({ error: 'Host profile not found' });
    const host = rows[0];
    const customerId = await resolveCustomer(stripe, host, email);

    // ── One-time event pass (PaymentIntent) ───────────────────────────────────
    if (type === 'one_time_pass') {
      if (!eventId) return res.status(400).json({ error: 'eventId required for one_time_pass' });
      const { rows: evRows } = await pool.query(
        `SELECT id FROM events WHERE id = $1 AND host_id = $2`,
        [eventId, host.id],
      );
      if (!evRows.length) return res.status(404).json({ error: 'Event not found or not yours' });

      const pi = await stripe.paymentIntents.create({
        amount:      1900,
        currency:    'gbp',
        customer:    customerId,
        description: 'Picachoo Pro Event Pass',
        metadata:    { hostId: host.id, eventId, type: 'one_time_pass' },
        automatic_payment_methods: { enabled: true },
      });
      return res.json({ clientSecret: pi.client_secret });
    }

    // ── Annual subscriptions (Subscription + expand payment intent) ───────────
    const priceId = type === 'pro_annual'
      ? process.env.STRIPE_PRICE_PRO_ANNUAL
      : process.env.STRIPE_PRICE_BUSINESS_ANNUAL;

    if (!priceId) {
      return res.status(500).json({ error: 'Stripe price not configured for this plan' });
    }

    const { promoCodeId } = req.body ?? {};

    const subscription = await stripe.subscriptions.create({
      customer:         customerId,
      items:            [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand:           ['latest_invoice.payment_intent'],
      metadata:         { hostId: host.id, type },
      ...(promoCodeId ? { promotion_code: promoCodeId } : {}),
    });

    const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;
    if (!clientSecret) {
      const diagStatus = subscription.latest_invoice?.status;
      const diagPiStatus = subscription.latest_invoice?.payment_intent?.status;
      console.error('[stripe] subscription missing clientSecret — invoice.status:', diagStatus, 'pi.status:', diagPiStatus, 'sub.status:', subscription.status);
      return res.status(500).json({
        error: `Could not initialise subscription payment (invoice: ${diagStatus ?? 'null'}, sub: ${subscription.status}). Check that STRIPE_PRICE_PRO_ANNUAL / STRIPE_PRICE_BUSINESS_ANNUAL are set and match your Stripe mode (test vs live).`,
      });
    }
    return res.json({ clientSecret, subscriptionId: subscription.id });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/stripe/activate ───────────────────────────────────────────────
// Called by the frontend immediately after a successful payment to apply the
// tier / pass without waiting for a webhook.  Verifies with Stripe directly.
router.post('/activate', requireAuth, async (req, res, next) => {
  try {
    const stripe = getStripe();
    const { type, paymentIntentId, subscriptionId, eventId } = req.body ?? {};
    const { authId } = req.user;

    const { rows } = await pool.query(`SELECT id FROM hosts WHERE auth_id = $1`, [authId]);
    if (!rows.length) return res.status(404).json({ error: 'Host not found' });
    const hostId = rows[0].id;

    // ── One-time event pass ───────────────────────────────────────────────────
    if (type === 'one_time_pass') {
      if (!paymentIntentId || !eventId) {
        return res.status(400).json({ error: 'paymentIntentId and eventId required' });
      }
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (pi.status !== 'succeeded') {
        return res.status(400).json({ error: `Payment not completed (status: ${pi.status})` });
      }
      if (pi.metadata?.hostId !== hostId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const passExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await pool.query(
        `UPDATE events SET is_premium_pass = TRUE, pass_expires_at = $1
         WHERE id = $2 AND host_id = $3`,
        [passExpires.toISOString(), eventId, hostId],
      );
      return res.json({ activated: true });
    }

    // ── Annual subscriptions ──────────────────────────────────────────────────
    if (type === 'pro_annual' || type === 'business_annual') {
      if (!subscriptionId) return res.status(400).json({ error: 'subscriptionId required' });
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      if (!['active', 'trialing'].includes(sub.status)) {
        return res.status(400).json({ error: `Subscription not active (status: ${sub.status})` });
      }
      if (sub.metadata?.hostId !== hostId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      await pool.query(
        `UPDATE hosts SET tier = $1, stripe_subscription_id = $2 WHERE id = $3`,
        [type, sub.id, hostId],
      );
      return res.json({ activated: true, tier: type });
    }

    return res.status(400).json({ error: 'Invalid activation request' });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/stripe/apply-promo ────────────────────────────────────────────
router.post('/apply-promo', requireAuth, async (req, res, next) => {
  try {
    const stripe = getStripe();
    const { code } = req.body ?? {};
    if (!code) return res.status(400).json({ error: 'code is required' });

    const promoCodes = await stripe.promotionCodes.list({ code: code.trim().toUpperCase(), active: true, limit: 1 });
    if (!promoCodes.data.length) return res.status(404).json({ error: 'Invalid or expired promo code' });

    const promoCode = promoCodes.data[0];
    const coupon = promoCode.coupon;
    const discount = coupon.percent_off
      ? `${coupon.percent_off}% off`
      : coupon.amount_off
        ? `£${(coupon.amount_off / 100).toFixed(2)} off`
        : 'Discount applied';

    return res.json({ valid: true, promoCodeId: promoCode.id, discount, message: `✓ ${discount}` });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/stripe/cancel-subscription ────────────────────────────────────
// Cancels the host's active subscription at period end (graceful cancellation).
router.post('/cancel-subscription', requireAuth, async (req, res, next) => {
  try {
    const stripe = getStripe();
    const { authId } = req.user;

    const { rows } = await pool.query(
      `SELECT id, stripe_customer_id FROM hosts WHERE auth_id = $1`,
      [authId],
    );
    if (!rows.length) return res.status(404).json({ error: 'Host not found' });
    const { id: hostId, stripe_customer_id: customerId } = rows[0];
    if (!customerId) return res.status(400).json({ error: 'No billing account found' });

    // Find the active subscription for this customer
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status:   'active',
      limit:    5,
    });

    const active = subs.data.find(s => s.metadata?.hostId === hostId);
    if (!active) return res.status(404).json({ error: 'No active subscription found' });

    // Cancel at period end — user keeps access until the billing period expires
    const cancelled = await stripe.subscriptions.update(active.id, {
      cancel_at_period_end: true,
    });

    res.json({
      ok: true,
      cancelAt: cancelled.cancel_at,           // Unix timestamp
      currentPeriodEnd: cancelled.current_period_end,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/stripe/webhook ─────────────────────────────────────────────────
router.post('/webhook', async (req, res) => {
  const stripe = getStripe();
  const sig    = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error('[stripe webhook] signature verification failed:', err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  try {
    // One-time pass: PaymentIntent succeeded
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const { eventId, type } = pi.metadata ?? {};
      if (type === 'one_time_pass' && eventId) {
        const passExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await pool.query(
          `UPDATE events SET is_premium_pass = TRUE, pass_expires_at = $1 WHERE id = $2`,
          [passExpires.toISOString(), eventId],
        );
        console.log(`[stripe] one_time_pass activated for event ${eventId}`);
      }
    }

    // Subscription activated: invoice paid
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      if (!invoice.subscription) return res.json({ received: true });
      const sub = await stripe.subscriptions.retrieve(invoice.subscription);
      const { hostId, type } = sub.metadata ?? {};
      if (hostId && (type === 'pro_annual' || type === 'business_annual')) {
        await pool.query(
          `UPDATE hosts SET tier = $1, stripe_subscription_id = $2 WHERE id = $3`,
          [type, sub.id, hostId],
        );
        console.log(`[stripe] ${type} activated for host ${hostId}`);
      }
    }

    // Subscription cancelled → downgrade to free
    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      await pool.query(
        `UPDATE hosts SET tier = 'free', stripe_subscription_id = NULL
         WHERE stripe_subscription_id = $1`,
        [sub.id],
      );
    }
  } catch (err) {
    console.error('[stripe webhook] DB error:', err.message);
  }

  res.json({ received: true });
});

module.exports = router;
