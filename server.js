require('dotenv').config(); // Load environment variables
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors'); // Import CORS middleware
const ussdRoutes = require('./controllers/ussdController'); // Import USSD routes
const paymentRoutes = require('./routes/paymentRoutes'); // Import payment routes
const smsRoutes = require('./routes/smsRoutes'); // Import SMS routes
const { initiatePayment } = require('./tmp/paymentService.js');

const app = express();

// Middleware
app.use(cors()); // Use CORS middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // Ensure JSON requests are parsed
app.use(morgan('dev')); // Log requests

// Route for handling USSD requests
app.post('/ussd', ussdRoutes.handleUssdRequest);

// Use payment routes
app.use('/payment', paymentRoutes); // Route for payment-related actions

// Use SMS routes
app.use('/sms', smsRoutes); // Route for SMS-related actions

// Error handling middleware (optional but recommended)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});



// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`USSD app running on port ${PORT}`);
});
