const { Friend } = require('../models');

const sendFriendRequest = async (req, res) => {
  const userId = req.user.userId; // From JWT middleware
  const { friendId } = req.body;

  try {
    const request = await Friend.create({ userId, friendId });
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: 'Error sending request' });
  }
};

const acceptFriendRequest = async (req, res) => {
  const { requestId } = req.params;

  try {
    const request = await Friend.findByPk(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = 'accepted';
    await request.save();
    res.json({ message: 'Friend request accepted' });
  } catch (err) {
    res.status(500).json({ message: 'Error accepting request' });
  }
};

module.exports = { sendFriendRequest, acceptFriendRequest };
