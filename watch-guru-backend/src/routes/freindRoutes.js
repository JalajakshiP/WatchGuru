const express = require('express');
const router = express.Router();
const { sendFriendRequest, acceptFriendRequest } = require('../controllers/friendController');
const authenticate = require('../middleware/authenticate'); // JWT middleware

router.post('/send', authenticate, sendFriendRequest);
router.put('/accept/:requestId', authenticate, acceptFriendRequest);

module.exports = router;
