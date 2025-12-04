const express = require('express');
const router = express.Router();
const { connectToDB } = require('../lib/mongoose');
const { MovieModel } = require('../models/Movie');
const mongoose = require('mongoose');

// GET /api/movies - Get all movies (with optional query parameters)
// Query params: ?genre=Action&year=2020&limit=10
router.get('/', async (req, res) => {
  try {
    await connectToDB();
    
    const { genre, year, limit } = req.query;
    let query = {};
    
    if (genre) {
      query.genre = genre;
    }
    
    if (year) {
      query.releaseYear = parseInt(year);
    }
    
    let moviesQuery = MovieModel.find(query);
    
    if (limit) {
      moviesQuery = moviesQuery.limit(parseInt(limit));
    }
    
    const movies = await moviesQuery.lean();
    
    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/movies/:id - Get a single movie by ID
router.get('/:id', async (req, res) => {
  try {
    await connectToDB();
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid movie ID format' });
    }
    
    const movie = await MovieModel.findById(id)
      .populate('reviews')
      .populate('favoritedBy', '_id username email')
      .lean();
    
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    // Populate user info for reviews
    if (movie.reviews && movie.reviews.length > 0) {
      const { UserModel } = require('../models/User');
      const reviewsWithUsers = await Promise.all(
        movie.reviews.map(async (review) => {
          if (review.userId) {
            const user = await UserModel.findById(review.userId).select('username email').lean();
            return { ...review, user };
          }
          return review;
        })
      );
      movie.reviews = reviewsWithUsers;
    }
    
    res.json(movie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/movies - Create a new movie
router.post('/', async (req, res) => {
  try {
    await connectToDB();
    const { title, description, releaseYear, posterURL, genre } = req.body;
    
    if (!title || !description || !releaseYear || !genre) {
      return res.status(400).json({ error: 'Title, description, releaseYear, and genre are required' });
    }
    
    const movie = new MovieModel({
      title,
      description,
      releaseYear: parseInt(releaseYear),
      posterURL: posterURL || '',
      genre,
      reviews: [],
      favoritedBy: []
    });
    
    const savedMovie = await movie.save();
    res.status(201).json(savedMovie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/movies/:id - Update a movie (full update)
router.put('/:id', async (req, res) => {
  try {
    await connectToDB();
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid movie ID format' });
    }
    
    const { title, description, releaseYear, posterURL, genre } = req.body;
    const updateData = {};
    
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (releaseYear) updateData.releaseYear = parseInt(releaseYear);
    if (posterURL !== undefined) updateData.posterURL = posterURL;
    if (genre) updateData.genre = genre;
    
    const movie = await MovieModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    res.json(movie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/movies/:id - Partially update a movie
router.patch('/:id', async (req, res) => {
  try {
    await connectToDB();
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid movie ID format' });
    }
    
    const movie = await MovieModel.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    res.json(movie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/movies/:id - Delete a movie
router.delete('/:id', async (req, res) => {
  try {
    await connectToDB();
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid movie ID format' });
    }
    
    const movie = await MovieModel.findByIdAndDelete(id);
    
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    res.json({ message: 'Movie deleted successfully', deletedId: id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/movies/:id/reviews - Get all reviews for a specific movie
router.get('/:id/reviews', async (req, res) => {
  try {
    await connectToDB();
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid movie ID format' });
    }
    
    const { ReviewModel } = require('../models/Review');
    const reviews = await ReviewModel.find({ movieId: id })
      .populate('userId', '_id username')
      .populate('movieId', '_id title')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/movies/:id/reviews - Create a review for a movie
router.post('/:id/reviews', async (req, res) => {
  try {
    await connectToDB();
    const { id } = req.params;
    const { rating, comment, userId } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid movie ID format' });
    }
    
    if (!rating || !comment || !userId) {
      return res.status(400).json({ error: 'Rating, comment, and userId are required' });
    }
    
    const { ReviewModel } = require('../models/Review');
    const { UserModel } = require('../models/User');
    
    // Verify movie exists
    const movie = await MovieModel.findById(id);
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
      movieId: id,
      userId: userId,
      createdAt: new Date()
    });
    
    const savedReview = await review.save();
    
    // Update movie to include review reference
    await MovieModel.updateOne(
      { _id: id },
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

module.exports = router;

