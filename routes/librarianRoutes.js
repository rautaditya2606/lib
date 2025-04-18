const express = require('express');
const router = express.Router();

// Render the QR scanning view for librarians
router.get('/librarian/scan', (req, res) => {
  res.render('librarian/scan');
});

module.exports = router;
