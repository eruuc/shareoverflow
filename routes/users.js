const express = require('express');
const router = express.Router();
const { connectToDB } = require('../lib/mongoose');
const { UserModel } = require('../models/User');
const { MovieModel } = require('../models/Movie');
const { ReviewModel } = require('../models/Review');
const mongoose = require('mongoose');

// GET /api/users - Get all users (with optional query parameters)
// Query params: ?role=RegularUser&limit=10
router.get('/', async (req, res) => {
  try {
    await connectToDB();
    
    const { role, limit } = req.query;
    let query = {};
    
    if (role) {
      query.role = role;
    }
    
    let usersQuery = UserModel.find(query).select('-password');
    
    if (limit) {
      usersQuery = usersQuery.limit(parseInt(limit));
    }
    
    const users = await usersQuery.lean();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:id - Get a single user by ID
// Query params: ?viewerId=xxx (to show private info if viewer is the user)
router.get('/:id', async (req, res) => {
  try {
    await connectToDB();
    const { id } = req.params;
    const viewerId = req.query.viewerId;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    const user = await UserModel.findById(id)
      .populate('favorites')
      .populate('reviews')
      .populate('following', '_id username')
      .populate('followers', '_id username')
      .lean();
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        userId: id,
        message: `No user found with ID: ${id}`
      });
    }
    
    // Populate movie details for reviews
    if (user.reviews && user.reviews.length > 0) {
      const movieIds = user.reviews.map((r) => r.movieId);
      const movies = await MovieModel.find({ _id: { $in: movieIds } });
      user.reviews = user.reviews.map((r) => ({
        ...r,
        movie: movies.find((m) => m._id.equals(r.movieId))
      }));
    }
    
    // Privacy: hide email/phone unless viewerId === userId
    if (!viewerId || viewerId !== id) {
      delete user.email;
      delete user.phone;
    }
    
    // Remove password from response
    delete user.password;
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users - Create a new user
router.post('/', async (req, res) => {
  try {
    await connectToDB();
    const { username, email, password, role } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    // Check if user already exists
    const existing = await UserModel.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    const { RegularUser } = require('../models/User');
    const user = new RegularUser({
      username,
      email,
      password, // TODO: Hash password
      joinDate: new Date(),
      favorites: [],
      reviews: [],
      following: [],
      followers: []
    });
    
    const savedUser = await user.save();
    const { password: _, ...userWithoutPassword } = savedUser.toObject();
    
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/:id - Update a user (full update)
router.put('/:id', async (req, res) => {
  try {
    await connectToDB();
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    const { username, email, phone } = req.body;
    const updateData = {};
    
    // Prevent username and password changes via this endpoint
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    
    const user = await UserModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/users/:id - Partially update a user
router.patch('/:id', async (req, res) => {
  try {
    await connectToDB();
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    const { email, phone } = req.body;
    const update = {};
    
    if (email) update.email = email;
    if (phone !== undefined) update.phone = phone;
    
    // Prevent username and password changes
    await UserModel.updateOne({ _id: id }, { $set: update });
    
    const user = await UserModel.findById(id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/users/:id - Delete a user
router.delete('/:id', async (req, res) => {
  try {
    await connectToDB();
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    const user = await UserModel.findByIdAndDelete(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully', deletedId: id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users/:id/favorite/:movieId - Add movie to user's favorites
router.post('/:id/favorite/:movieId', async (req, res) => {
  try {
    await connectToDB();
    const { id, movieId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    // Add to user's favorites
    await UserModel.updateOne(
      { _id: id },
      { $addToSet: { favorites: movieId } }
    );
    
    // Add to movie's favoritedBy
    await MovieModel.updateOne(
      { _id: movieId },
      { $addToSet: { favoritedBy: id } }
    );
    
    res.json({ success: true, message: 'Movie added to favorites' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/users/:id/favorite/:movieId - Remove movie from user's favorites
router.delete('/:id/favorite/:movieId', async (req, res) => {
  try {
    await connectToDB();
    const { id, movieId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    // Remove from user's favorites
    await UserModel.updateOne(
      { _id: id },
      { $pull: { favorites: movieId } }
    );
    
    // Remove from movie's favoritedBy
    await MovieModel.updateOne(
      { _id: movieId },
      { $pull: { favoritedBy: id } }
    );
    
    res.json({ success: true, message: 'Movie removed from favorites' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users/:id/follow/:followId - Follow another user
router.post('/:id/follow/:followId', async (req, res) => {
  try {
    await connectToDB();
    const { id, followId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(followId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    if (id === followId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    
    // Add to user's following list
    await UserModel.updateOne(
      { _id: id },
      { $addToSet: { following: followId } }
    );
    
    // Add to other user's followers list
    await UserModel.updateOne(
      { _id: followId },
      { $addToSet: { followers: id } }
    );
    
    res.json({ success: true, message: 'User followed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/users/:id/follow/:followId - Unfollow a user
router.delete('/:id/follow/:followId', async (req, res) => {
  try {
    await connectToDB();
    const { id, followId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(followId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    // Remove from user's following list
    await UserModel.updateOne(
      { _id: id },
      { $pull: { following: followId } }
    );
    
    // Remove from other user's followers list
    await UserModel.updateOne(
      { _id: followId },
      { $pull: { followers: id } }
    );
    
    res.json({ success: true, message: 'User unfollowed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

