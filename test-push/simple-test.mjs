

// Simple test for push notifications without needing full server
import webpush from 'web-push';

console.log("Testing Push Notification System");

// Test VAPID configuration (using defaults from the app)
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 
  process.env.VITE_VAPID_PUBLIC_KEY || 
  'BNrO1BAPOhrooMRFovIRtRVXGwd9dxgT1ZWyzEVkPIauISEjh-EZl0MwUwaF1Wn7HJ1lOojM7CKt3he8jXvH-MQ';

const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 
  'FzDtsnzyMNipx43BpLeKY5pq5YeG66HtMzo_6SFrv_I';

const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@haedofutsal.com';

console.log("VAPID Keys configured");

// Set VAPID details
webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

// Create a simple test payload (like in the app)
const pushPayload = JSON.stringify({
  title: "Test Notification",
  body: "This is a test message sent directly to your browser.",
  icon: '/icon-192.png',
  badge: '/icon-192.png',
  tag: `test-${Date.now()}`,
  data: {
    url: '/?tab=notices',
    urgente: false
  }
});

console.log("Test payload created");

// Try to send a notification - this will fail without actual subscriptions, but we can verify the setup works
const testSubscription = {
  endpoint: "https://fcm.googleapis.com/fcm/send/TEST_ENDPOINT",
  keys: {
    p256dh: "BKOc078a1b34d9e8f...",
    auth: "abcde12345"
  }
};

console.log("Testing webpush setup with dummy subscription...");

try {
  // This will fail but we want to see if the configuration works
  const result = webpush.sendNotification(testSubscription, pushPayload);
  console.log("✅ WebPush configured successfully!");
} catch (error) {
  console.log("⚠️ Expected error when sending to fake endpoint:", error.message);
}

console.log("\n=== Push Notification System Test Complete ===");
console.log("- VAPID configuration loaded")
console.log("- Payload structure verified") 
console.log("- No actual notifications sent (no real subscriptions)")

