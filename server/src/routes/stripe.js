const express = require('express');
const router  = express.Router();
const pool       = require('../config/db');
const requireAuth = require('../middleware/requireAuth');

function getStripe() {
  // Lazy-load so the module doesn't crash if STRIPE_SECRET_KEY is unset during tests
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// ─── POST /api/stripe/checkout ────────────────────────────────────────────────
// Creates a Stripe Checkout session.
// body: { type: 'one_time_pass' | 'pro_annual' | 'business_annual', eventId? }
// Returns { url } — the client should redirect to it.
router.post('/checkout', requireAuth, async (req, res, next) => {
  try {
    const stripe = getStripe();
    const { type, eventId } = req.body ?? {};
    const { authId, email } = req.user;

    const VALID_TYPES = ['one_time_pass', 'pro_annual', 'business_annual'];
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Invalid checkout type' });
    }

    // Resolve host row
    const { rows } = await pool.query(
      `SELECT id, stripe_customer_id FROM hosts WHERE auth_id = $1`,
      [authId],
    );
    if (!rows.length) return res.status(404).json({ error: 'Host profile not found' });
    const host = rows[0];

    // Get or create Stripe customer
    let customerId = host.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { hostId: host.id, authId },
      });
      customerId = customer.id;
      await pool.query(
        `UPDATE hosts SET stripe_customer_id = $1 WHERE id = $2`,
        [customerId, host.id],
      );
    }

    const origin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

    // ── One-time event pass ───────────────────────────────────────────────────
    if (type === 'one_time_pass') {
      if (!eventId) return res.status(400).json({ error: 'eventId required for one_time_pass' });

      const { rows: evRows } = await pool.query(
        `SELECT id FROM events WHERE id = $1 AND host_id = $2`,
        [eventId, host.id],
      );
      if (!evRows.length) return res.status(404).json({ error: 'Event not found or not yours' });

      const session = await stripe.checkout.sessions.create({
        customer:  customerId,
        mode:      'payment',
        line_items: [{ price: process.env.STRIPE_PRICE_ONE_TIME_PASS, quantity: 1 }],
        metadata:  { hostId: host.id, eventId, type: 'one_time_pass' },
        success_url: `${origin}/dashboard?checkout=success&type=pass`,
        cancel_url:  `${origin}/pricing`,
      });
      return res.json({ url: session.url });
    }

    // ── Annual subscriptions ─────────────────────────────────────────────────
    const priceId = type === 'pro_annual'
      ? process.env.STRIPE_PRICE_PRO_ANNUAL
      : process.env.STRIPE_PRICE_BUSINESS_ANNUAL;

    if (!priceId) {
      return res.status(500).json({ error: 'Stripe price not configured for this plan' });
    }

    const session = await stripe.checkout.sessions.create({
      customer:  customerId,
      mode:      'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata:  { hostId: host.id, type },
      success_url: `${origin}/dashboard?checkout=success&type=subscription`,
      cancel_url:  `${origin}/pricing`,
    });
    return res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/stripe/webhook ─────────────────────────────────────────────────
// Stripe sends raw bytes; body has already been captured into req.rawBody
// by the express.json verify function in index.js.
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
    if (event.type === 'checkout.session.completed') {
      const session  = event.data.object;
      const { hostId, eventId, type } = session.metadata ?? {};

      if (type === 'one_time_pass' && eventId) {
        const passExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await pool.query(
          `UPDATE events SET is_premium_pass = TRUE, pass_expires_at = $1 WHERE id = $2`,
          [passExpires.toISOString(), eventId],
        );
        console.log(`[stripe] one_time_pass activated for event ${eventId}, expires ${passExpires.toISOString()}`);
      }

      if (type === 'pro_annual' || type === 'business_annual') {
        await pool.query(
          `UPDATE hosts SET tier = $1 WHERE id = $2`,
          [type, hostId],
        );
        if (session.subscription) {
          await pool.query(
            `UPDATE hosts SET stripe_subscription_id = $1 WHERE id = $2`,
            [session.subscription, hostId],
          );
        }
        console.log(`[stripe] ${type} activated for host ${hostId}`);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const { rowCount } = await pool.query(
        `UPDATE hosts SET tier = 'free', stripe_subscription_id = NULL
         WHERE stripe_subscription_id = $1`,
        [sub.id],
      );
      if (rowCount) console.log(`[stripe] subscription ${sub.id} cancelled → tier reset to free`);
    }
  } catch (err) {
    console.error('[stripe webhook] DB error:', err.message);
    // Still return 200 so Stripe doesn't retry indefinitely
  }

  res.json({ received: true });
});

module.exports = router;
