const paymentService = require('./services/paymentService');

async function testInitiatePayment() {
  const phoneNumber = '0551196764'; // Replace with your test mobile number
  const amount = 1; // Test amount (in GHS)
  const provider = 'mtn'; // Mobile money provider (can be 'mtn', 'vodafone', 'airteltigo')

  try {
    const paymentResponse = await paymentService.initiatePayment({
      amount, 
      customer_msisdn: phoneNumber, 
      provider, 
      description: 'Test Payment', 
      client_reference: 'TestRef123', // Unique reference for this transaction
      primary_callback_url: 'https://09aa-102-176-65-239.ngrok-free.app/payment/callback ' // Replace with your actual callback URL
    });
    console.log('Payment Response:', paymentResponse);
  } catch (error) {
    console.error('Error initiating payment:', error.message);
  }
}

// Run the test
testInitiatePayment();
