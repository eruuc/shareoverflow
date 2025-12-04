const express = require('express');
const router = express.Router();
const { connectToDB } = require('../lib/mongoose');
const { ReviewModel } = require('../models/Review');
const { UserModel } = require('../models/User');
const { MovieModel } = require('../models/Movie');
const mongoose = require('mongoose');

// GET /api/reviews - Get all reviews (with optional query parameters)
// Query params: ?movieId=xxx&userId=xxx&rating=5&limit=10
router.get('/', async (req, res) => {
  try {
    await connectToDB();
    
    const { movieId, userId, rating, limit } = req.query;
    let query = {};
    
    if (movieId) {
      query.movieId = movieId;
    }
    
    if (userId) {
      query.userId = userId;
    }
    
    if (rating) {
      query.rating = parseInt(rating);
    }
    
    let reviewsQuery = ReviewModel.find(query)
      .populate('userId', '_id username')
      .populate('movieId', '_id title')
      .sort({ createdAt: -1 });
    
    if (limit) {
      reviewsQuery = reviewsQuery.limit(parseInt(limit));
    }
    
    const reviews = await reviewsQuery.lean();
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reviews/:id - Get a single review by ID
router.get('/:id', async (req, res) => {
  try {
    await connectToDB();
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid review ID format' });
    }
    
    const review = await ReviewModel.findById(id)
      .populate('userId', '_id username')
      .populate('movieId', '_id title')
      .lean();
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/reviews - Create a new review
router.post('/', async (req, res) => {
  try {
    await connectToDB();
    const { rating, comment, movieId, userId } = req.body;
    
    if (!rating || !comment || !movieId || !userId) {
      return res.status(400).json({ error: 'Rating, comment, movieId, and userId are required' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(movieId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid movieId or userId format' });
    }
    
    // Verify movie exists
    const movie = await MovieModel.findById(movieId);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    // Verify user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Create review
    const review = new ReviewModel({
      rating: parseInt(rating),
      comment,
      movieId: movieId,
      userId: userId,
      createdAt: new Date()
    });
    
    const savedReview = await review.save();
    
    // Update movie to include review reference
    await MovieModel.updateOne(
      { _id: movieId },
      { $addToSet: { reviews: savedReview._id } }
    );
    
    // Update user to include review reference
    await UserModel.updateOne(
      { _id: userId },
      { $addToSet: { reviews: savedReview._id } }
    );
    
    res.status(201).json(savedReview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/reviews/:id - Update a review (full update)
router.put('/:id', async (req, res) => {
  try {
    await connectToDB();
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid review ID format' });
    }
    
    const { rating, comment } = req.body;
    const updateData = {};
    
    if (rating !== undefined) updateData.rating = parseInt(rating);
    if (comment) updateData.comment = comment;
    
    const review = await ReviewModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/reviews/:id - Partially update a review
router.patch('/:id', async (req, res) => {
  try {
    await connectToDB();
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid review ID format' });
    }
    
    const review = await ReviewModel.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/reviews/:id - Delete a review
router.delete('/:id', async (req, res) => {
  try {
    await connectToDB();
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid review ID format' });
    }
    
    const review = await ReviewModel.findById(id);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    // Remove review reference from movie
    await MovieModel.updateOne(
      { _id: review.movieId },
      { $pull: { reviews: review._id } }
    );
    
    // Remove review reference from user
    await UserModel.updateOne(
      { _id: review.userId },
      { $pull: { reviews: review._id } }
    );
    
    // Delete the review
    await ReviewModel.findByIdAndDelete(id);
    
    res.json({ message: 'Review deleted successfully', deletedId: id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

