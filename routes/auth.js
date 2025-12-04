const express = require('express');
const router = express.Router();
const { connectToDB } = require('../lib/mongoose');
const { UserModel } = require('../models/User');
const { RegularUser } = require('../models/User');

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    await connectToDB();
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await UserModel.findOne({ email }).lean();
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // TODO: Implement proper password hashing
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    if (!user._id) {
      return res.status(500).json({ error: 'User data error: missing ID' });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    const response = {
      _id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role || 'RegularUser',
      roles: [user.role || 'RegularUser']
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/register - User registration
router.post('/register', async (req, res) => {
  try {
    await connectToDB();
    const { email, password, username } = req.body;
    
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username are required' });
    }
    
    // Check if user already exists
    const existing = await UserModel.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Create regular user
    const user = new RegularUser({
      username: username,
      email: email,
      password: password, // TODO: Hash password
      joinDate: new Date(),
      favorites: [],
      reviews: [],
      following: [],
      followers: []
    });
    
    await user.save();
    
    res.status(201).json({
      _id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role || 'RegularUser',
      roles: [user.role || 'RegularUser']
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

