const express = require('express');
const { addRating, getRatings } = require('../controllers/ratingController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', protect, addRating);
router.get('/:contentId', getRatings);

module.exports = router;
