
// Test script to send a push notification via the API endpoint

import fetch from 'node-fetch';

const TEST_API_URL = 'http://localhost:54714/api/send-push'; // Adjust port as needed
const PAYLOAD = {
  titulo: "Test Notification",
  contenido: "This is a test message sent directly to your browser.",
  urgente: true,
};

async function sendTestNotification() {
  try {
    console.log("Sending test notification...");
    
    const response = await fetch(TEST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(PAYLOAD)
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Test notification sent successfully!");
      console.log("Response:", JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.error("❌ Failed to send test notification:");
      console.error("Status Code:", response.status);
      console.error("Error Response:", errorText);
    }
  } catch (error) {
    console.error("💥 Error sending test notification:", error.message);
  }
}

sendTestNotification();
