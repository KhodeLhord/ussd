const express = require('express');
const router = express.Router();
const ussdController = require('../controllers/ussdController');

router.post('/', ussdController.handleUssdRequest);

module.exports = router;
