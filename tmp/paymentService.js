const https = require('https');
const { sendConfirmation } = require('../services/smsService.js');

const initiatePayment = (phoneNumber, numberOfVotes) => {
  const totalAmount = numberOfVotes * 1; // Amount in pesewas (GHS 1.00 per vote)

  const params = JSON.stringify({
    email: `filibiinfanax10@gmail.com`, // Use a valid email in production
    amount: totalAmount,
    currency: 'GHS',
    mobile_money: {
      phone: phoneNumber,
      provider: 'mtn' // Options: 'mtn', 'vodafone', 'airtel'
    },
    offline_reference: phoneNumber // Offline reference for tracking the offline payment
  });

  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: '/charge',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.status) {
            // Notify the user to complete the payment via offline prompt
            // sendConfirmation(phoneNumber, numberOfVotes, 'Your payment is pending. Complete it via your mobile money provider.', 'EMA');
            resolve({ success: true, data: response.data });
          } else {
            resolve({ success: false, message: response.message });
          }
        } catch (error) {
          reject(`Error parsing response: ${error.message}`);
        }
      });
    });

    req.on('error', error => {
      reject(`Request error: ${error.message}`);
    });

    req.write(params);
    req.end();
  });
};

module.exports = {
  initiatePayment
};
