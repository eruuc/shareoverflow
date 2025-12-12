const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  rating: Number,
  comment: String,
  createdAt: Date,
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { collection: 'reviews' });

const ReviewModel = mongoose.models.Review || mongoose.model('Review', reviewSchema);

module.exports = { ReviewModel };