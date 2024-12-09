const https = require('https');
const { sendConfirmation } = require('../services/smsService.js');

const initiatePayment = (phoneNumber, numberOfVotes) => {
  const totalAmount = 1; // Amount in pesewas (GHS 1.00 per vote)

  // Parameters for the payment initiation request
  const params = JSON.stringify({
    email: "filibiinfanax10@gmail.com", // Replace with a real email
    amount: totalAmount, // Amount in pesewas
    currency: "GHS",
    ussd: {
      type: "737" // Example of MTN USSD code; adjust as necessary
    },
    metadata: {
      custom_fields: [
        {
          display_name: "Donation for",
          variable_name: "donation_for",
          value: "makurdi" // Custom value for donation
        }
      ]
    }
  });

  // Options for the Paystack API request
  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: '/charge',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, // Use an environment variable for security
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    // Send the request to Paystack API
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.status) {
            console.log('Payment Initiated Successfully:', response.data);
            // Send confirmation SMS on successful initiation
            sendConfirmation(phoneNumber, numberOfVotes, 'filibin fanax', 'EMA');
            resolve({ success: true, data: response.data });
          } else {
            console.log('Payment Initiation Failed:', response);
            resolve({ success: false, message: response.message });
          }
        } catch (error) {
          console.error('Error parsing response:', error.message);
          reject(`Error parsing response: ${error.message}`);
        }
      });
    }).on('error', (error) => {
      console.error('Request error:', error.message);
      reject(`Request error: ${error.message}`);
    });

    // Send the parameters in the request body
    req.write(params);
    req.end();
  });
};

module.exports = {
  initiatePayment
};
