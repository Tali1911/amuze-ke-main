
const express = require('express');
const { 
  createCheckoutSession, 
  processMpesaPayment, 
  stripeWebhook, 
  verifyPaymentStatus,
  manualPaymentUpdate 
} = require('../controllers/payment');

const router = express.Router();

// Protect middleware
const { protect } = require('../middleware/auth');

// Special parsing for Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// Regular routes
router.post('/:registrationId', createCheckoutSession);
router.post('/mpesa/:registrationId', processMpesaPayment);
router.get('/verify/:registrationId', verifyPaymentStatus);
router.put('/manual/:registrationId', protect, manualPaymentUpdate);

module.exports = router;
