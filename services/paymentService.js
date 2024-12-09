const axios = require('axios');

// Function to initiate payment
const initiatePayment = async (phoneNumber, numberOfVotes, sessionId, nomineeId) => {
  const totalAmount = numberOfVotes * 100; // Amount in pesewas (GHS 1.00 per vote)

  const payload = {
    CustomerName: phoneNumber,
    CustomerMsisdn: phoneNumber,
    CustomerEmail: `${phoneNumber}@example.com`, // Use a real email in production
    Channel: 'mtn-gh', // Use the appropriate provider
    Amount: totalAmount / 100, // Amount in GHS
    PrimaryCallbackURL: process.env.HUBTEL_CALLBACK_URL,
    Description: `Payment for ${numberOfVotes} votes`,
    ClientReference: `${sessionId}-${nomineeId}`, // Unique reference
  };

  try {
    const response = await axios.post(
      `https://rmp.hubtel.com/merchantaccount/merchants/2020861/receive/mobilemoney`,
      payload,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.HUBTEL_CLIENT_ID}:${process.env.HUBTEL_CLIENT_SECRET}`
          ).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.ResponseCode === '0001') {
      return {
        success: true,
        data: response.data,
      };
    } else {
      return {
        success: false,
        message: response.data.Message || 'Payment initiation failed',
      };
    }
  } catch (error) {
    console.error('Error initiating payment:', error);
    return { success: false, message: 'Error initiating payment' };
  }
};

// Function to check transaction status
const checkTransactionStatus = async (transactionId) => {
  try {
    const response = await axios.get(
      `https://api-txnstatus.hubtel.com/transactions/2020861/status`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.HUBTEL_CLIENT_ID}:${process.env.HUBTEL_CLIENT_SECRET}`
          ).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        params: {
          transactionId, // Include the transaction ID in the query parameters
        },
      }
    );

    if (response.data.ResponseCode === '0000') {
      return {
        success: true,
        data: response.data,
      };
    } else {
      return {
        success: false,
        message: response.data.Message || 'Transaction verification failed',
      };
    }
  } catch (error) {
    console.error('Error checking transaction status:', error);
    return { success: false, message: 'Error checking transaction status' };
  }
};

module.exports = {
  initiatePayment,
  checkTransactionStatus,
};
