// testSms.js
const smsService = require('./services/smsService');

async function testSendConfirmation() {
  await smsService.sendConfirmation('0551196764', 2500, 'Collins Joe', 'Top Stars Award');
}

async function testSendFailed() {
  await smsService.sendFailed('0551196764', 'Khode Lhord', 'Elite Music Awards');
}

// Run tests
testSendConfirmation().then(() => console.log('Confirmation SMS sent.'));
testSendFailed().then(() => console.log('Failure SMS sent.'));
