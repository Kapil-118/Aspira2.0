const PushSubscription = require('../models/pushSubscription');
const webpush = require('web-push');

// Initialize Web Push with VAPID credentials
const initWebPush = () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (publicKey && privateKey) {
    webpush.setVapidDetails(
      'mailto:support@aspira.com',
      publicKey,
      privateKey
    );
  } else {
    console.warn('VAPID credentials not configured. Web Push notifications will be disabled.');
  }
};

// Call initialization
initWebPush();

// @desc    Register a new push subscription
// @route   POST /api/push/subscribe
// @access  Private
const subscribe = async (req, res) => {
  const { subscription } = req.body;

  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({ success: false, message: 'Invalid subscription payload.' });
  }

  try {
    // Check if subscription already exists for this user/endpoint
    const existing = await PushSubscription.findOne({
      userId: req.user._id,
      'subscription.endpoint': subscription.endpoint
    });

    if (existing) {
      existing.subscription = subscription;
      await existing.save();
    } else {
      await PushSubscription.create({
        userId: req.user._id,
        subscription
      });
    }

    res.status(200).json({ success: true, message: 'Subscribed to push notifications successfully.' });
  } catch (error) {
    console.error('Push subscribe error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Remove an existing push subscription
// @route   POST /api/push/unsubscribe
// @access  Private
const unsubscribe = async (req, res) => {
  const { endpoint } = req.body;

  if (!endpoint) {
    return res.status(400).json({ success: false, message: 'Endpoint is required for unsubscription.' });
  }

  try {
    await PushSubscription.deleteOne({
      userId: req.user._id,
      'subscription.endpoint': endpoint
    });

    res.status(200).json({ success: true, message: 'Unsubscribed from push notifications.' });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Get the public VAPID key
// @route   GET /api/push/vapid-public-key
// @access  Public
const getPublicKey = (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return res.status(404).json({ success: false, message: 'VAPID public key not configured.' });
  }
  res.status(200).json({ success: true, publicKey });
};

// Helper function to send push alerts
const sendPushNotification = async (userId, title, body, url = '/dashboard') => {
  try {
    const subscriptions = await PushSubscription.find({ userId });
    
    if (subscriptions.length === 0) return;

    const payload = JSON.stringify({
      title,
      body,
      icon: '/logo.jpg',
      url
    });

    const sendPromises = subscriptions.map(sub => 
      webpush.sendNotification(sub.subscription, payload)
        .catch(err => {
          // If subscription is expired or invalid, remove it from the DB
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`Removing inactive subscription endpoint: ${sub.subscription.endpoint}`);
            return PushSubscription.deleteOne({ _id: sub._id });
          }
          console.error('Failed to send webpush notification:', err.message);
        })
    );

    await Promise.all(sendPromises);
  } catch (error) {
    console.error('Send push notifications utility error:', error);
  }
};

module.exports = {
  subscribe,
  unsubscribe,
  getPublicKey,
  sendPushNotification
};
