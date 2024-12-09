const axios = require('axios');
require('dotenv').config();

// Base URL for Kairos Afrika SMS API
const SMS_API_URL = 'https://api.kairosafrika.com/v1/external/sms/quick';

// General SMS sending function
const sendSMS = async (to, message) => {
  try {
    const payload = {
      to: to,
      from: 'Xtocast',
      message: message,
      type: "Quick",
    };

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': process.env.X_API_KEY,
      'x-api-secret': process.env.X_API_SECRET,
    };

    const response = await axios.post(SMS_API_URL, JSON.stringify(payload), { headers });
    console.log('SMS Sent:', response.data);
    return response.data; // Return response for further use
  } catch (error) {
    console.error('SMS Sending Error:', error.response?.data || error.message);
    throw new Error('SMS sending failed');
  }
};

// Send confirmation message
exports.sendConfirmation = async (phoneNumber, numberOfVotes, nomineeName, eventName) => {
  const message = `Congratulations! You have successfully casted ${numberOfVotes} vote(s) for ${nomineeName} in the ${eventName}. Thanks for voting.\nXtocast - Bringing your events to life, One Click at a Time.`;
  return sendSMS(phoneNumber, message);
};

// Send failure message
exports.sendFailed = async (phoneNumber, nomineeName, eventName) => {
  const message = `We're sorry, your vote attempt for ${nomineeName} in the ${eventName} was unsuccessful. Please try again.\nXtocast - Bringing your events to life, One Click at a Time.`;
  return sendSMS(phoneNumber,  message);
};

// Example usage (uncomment to test):
// (async () => {
//   try {
//     await exports.sendConfirmation('233551196764', 5, 'John Doe', 'Annual Gala');
//   } catch (error) {
//     console.error(error.message);
//   }
// })();

