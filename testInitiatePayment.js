const paymentService = require('./services/paymentService');

async function testInitiatePayment() {
  try {
    const phoneNumber = '0551196764'; // Replace with your test mobile number
    const amount = 0.20; // Replace with the test amount (GHS)
    const provider = 'mtn'; // Example provider ('mtn', 'vodafone', 'airteltigo')
    const sessionId = 'test-session'; // Use a unique identifier for the session

    // Initiate payment
    const paymentResponse = await paymentService.initiatePayment(phoneNumber, amount, provider, sessionId);
    
    // Log the payment response
    console.log('Payment Response:', paymentResponse);
  } catch (error) {
    // Log any errors during payment initiation
    console.error('Payment initiation failed:', error.message);
  }
}

// Run the test
testInitiatePayment();
