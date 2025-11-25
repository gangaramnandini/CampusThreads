const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const channelController = require('../controllers/channelController');


// Create new channel
router.post('/new', isAuthenticated, channelController.createChannel);

// List all channels in user's institution
router.get('/all', isAuthenticated, channelController.listChannels);

// Join a channel
router.post('/:id/join', isAuthenticated, channelController.joinChannel);

// Leave a channel
router.post('/:id/leave', isAuthenticated, channelController.leaveChannel);

// Get messages in a channel
router.get('/:id/messages', isAuthenticated, channelController.getMessages);

// // Add this route to your Express app or router setup
// router.get('/user/channels', isAuthenticated, channelController.getUserChannels);
router.get('/user/channels', isAuthenticated, channelController.getUserChannels);
// Send message to a channel
router.post('/:id/message', isAuthenticated, channelController.sendMessage);


module.exports = router;
