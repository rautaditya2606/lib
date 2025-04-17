const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const userController = require('../controllers/userController');

router.get('/test/email-reminder', 
  userController.isLibrarian,
  testController.testEmailReminder
);

router.get('/test/scenario', 
  userController.isLibrarian,
  testController.testSpecificReminder
);

module.exports = router;
