const mysql = require('mysql');
const paymentService = require('../tmp/paymentService.js');
const smsService = require('../services/smsService');
const logger = require('../utils/logger');
require('dotenv').config();

const sessionStore = {};

// MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    logger.error('Database connection failed', err);
    throw err;
  }
  logger.info('MySQL Connected...');
});

// Fetch nominee details by code
const getNomineeByCode = (nomineeCode) => {
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT nominees.name AS nominee_name, categories.name AS category_name, events.name AS event_name FROM nominees ' +
      'JOIN categories ON nominees.category_id = categories.id ' +
      'JOIN events ON categories.event_id = events.id ' +
      'WHERE nominees.nominee_code = ?',
      [nomineeCode],
      (err, result) => {
        if (err) {
          logger.error(`Error fetching nominee for code ${nomineeCode}, err`);
          console.log(' Error:', err);
          return reject(err);
        }
        console.log(' Nominee fetched successfully:', result);
        resolve(result[0]);
      }
    );
  });
};

exports.handleUssdRequest = async (req, res) => {
  const { SessionId, MSISDN, USERDATA } = req.body;
  const userInput = (USERDATA || '').trim();
  const sessionId = MSISDN;

  logger.info(`Received USSD request. SessionId: ${SessionId}, MSISDN: ${MSISDN}, User Input: ${userInput}`);

  let response = {};
  let session = sessionStore[sessionId] || { state: 'welcome' };

  try {
    switch (session.state) {
      // Welcome State
      case 'welcome':
        response = {
          USERID: SessionId,
          MSISDN,
          USERDATA: userInput,
          MSG: 'Welcome to Xtocast\n\nPlease Enter Nominee Code:',
          MSGTYPE: true
        };
        session.state = 'enter_nominee_code';
        sessionStore[sessionId] = session;
        break;

      // Nominee Code Entry
      case 'enter_nominee_code':
        const nomineeCode = userInput.toUpperCase();
        const nomineeDetails = await getNomineeByCode(nomineeCode);

        if (nomineeDetails) {
          session.nominee = nomineeDetails;
          session.state = 'confirm_nominee';
          sessionStore[sessionId] = session;

          response = {
            USERID: SessionId,
            MSISDN,
            USERDATA: userInput,
            MSG:`You're voting for ${nomineeDetails.nominee_name} in the ${nomineeDetails.event_name} as the ${nomineeDetails.category_name}.\nPress 1 to Confirm\nPress 2 to Reject`,
            MSGTYPE: true
          };
          console.log('response :', response);
        } else {
          response = {
            USERID: SessionId,
            MSISDN,
            USERDATA: userInput,
            MSG: 'Invalid Nominee Code. Please enter a valid code:',
            MSGTYPE: true
          };
          logger.warn(`Invalid nominee code entered: ${nomineeCode}`);
        }
        break;

      // Confirm Nominee
      case 'confirm_nominee':
        if (userInput === '1') {
          session.state = 'enter_vote_count';
          sessionStore[sessionId] = session;

          response = {
            USERID: SessionId,
            MSISDN,
            USERDATA: userInput,
            MSG: `How many votes would you like to cast for ${session.nominee.nominee_name}?`,
            MSGTYPE: true
          };
          console.log('response :', response);
        } else if (userInput === '2') {
          session.state = 'enter_nominee_code';
          sessionStore[sessionId] = session;

          response = {
            USERID: SessionId,
            MSISDN,
            USERDATA: userInput,
            MSG: 'Nominee selection rejected. Please enter a new Nominee Code:',
            MSGTYPE: true
          };
          console.log('response :', response);
        } else {
          response = {
            USERID: SessionId,
            MSISDN,
            USERDATA: userInput,
            MSG: 'Invalid choice. Press 1 to Confirm or 2 to Reject:',
            MSGTYPE: true
          };
          console.log('response :', response);
        }
        break;

      // Enter Number of Votes
      case 'enter_vote_count':
        const numberOfVotes = parseInt(userInput);
        if (isNaN(numberOfVotes) || numberOfVotes <= 0) {
          response = {
            USERID: SessionId,
            MSISDN,
            USERDATA: userInput,
            MSG: 'Invalid number of votes. Please enter a valid number:',
            MSGTYPE: true
          };
          console.log('response :', response);
        } else {
          const costPerVote = 100; // Cost in pesewas
          const totalCost = numberOfVotes * costPerVote;

          session.numberOfVotes = numberOfVotes;
          session.totalCost = totalCost;
          session.state = 'confirm_payment';
          sessionStore[sessionId] = session;

          response = {
            USERID: SessionId,
            MSISDN,
            USERDATA: userInput,
            MSG: `You're about to cast ${numberOfVotes} vote(s) for ${session.nominee.nominee_name}. Total cost is ${totalCost / 100} GHS.\nPress 1 to Confirm\nPress 2 to Cancel`,
            MSGTYPE: true
          };
          console.log('response :', response);
        }
        break;

      // Confirm Payment
      case 'confirm_payment':
        if (userInput === '1') {
          logger.info(`Initiating payment for ${MSISDN} for ${session.numberOfVotes} votes`);

          const paymentResponse = await paymentService.initiatePayment(MSISDN, session.totalCost, sessionId, session.nominee);

          if (paymentResponse.success) {
            response = {
              USERID: SessionId,
              MSISDN,
              USERDATA: userInput,
              MSG: `A payment prompt of ${session.totalCost / 100} GHS has been sent to your phone. Please approve to complete voting.`,
              MSGTYPE: false // End of session
            };
          console.log('response :', response);
            logger.info(`Payment prompt sent for ${session.numberOfVotes} votes`);
            delete sessionStore[sessionId];
          } else {
            response = {
              USERID: SessionId,
              MSISDN,
              USERDATA: userInput,
              MSG: `Payment failed: ${paymentResponse.message}`,
              MSGTYPE: false
            };
          console.log('response :', response);
            logger.error(`Payment failed: ${paymentResponse.message}`);
          }
        } else if (userInput === '2') {
          response = {
            USERID: SessionId,
            MSISDN,
            USERDATA: userInput,
            MSG: 'Vote canceled. Thank you for using Xtocast.',
            MSGTYPE: false // End of session
          };
          console.log('response :', response);
          logger.info('User canceled the vote');
          delete sessionStore[sessionId];
        } else {
          response = {
            USERID: SessionId,
            MSISDN,
            USERDATA: userInput,
            MSG: 'Invalid choice. Press 1 to Confirm payment or 2 to Cancel:',
            MSGTYPE: true
          };
          console.log('response :', response);
        }
        break;

      default:
        response = {
          USERID: SessionId,
          MSISDN,
          USERDATA: userInput,
          MSG: 'An error occurred. Please try again.',
          MSGTYPE: false
        };
        console.log('response :', response);
        logger.warn('Unexpected session state');
        delete sessionStore[sessionId];
        break;
    }

    return res.json(response);
  } catch (err) {
    logger.error('An error occurred during the USSD session', err);
    response = {
      USERID: SessionId,
      MSISDN,
      USERDATA: userInput,
      MSG: 'An error occurred. Please try again later.',
      MSGTYPE: false
    };
    return res.json(response);
  }
};