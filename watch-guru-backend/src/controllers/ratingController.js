const Rating = require('../models/Rating');

exports.addRating = async (req, res) => {
  const { content, rating, review, anonymous } = req.body;
  const newRating = new Rating({
    user: req.user.id,
    content,
    rating,
    review,
    anonymous,
  });
  await newRating.save();
  res.status(201).json({ message: 'Rating submitted' });
};

exports.getRatings = async (req, res) => {
  const { contentId } = req.params;
  const ratings = await Rating.find({ content: contentId }).populate('user', 'username');
  res.status(200).json(ratings);
};
