const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   GET /api/user/data
// @desc    Get complete user data (profile, contacts, location, alerts)
// @access  Private
router.get('/data', auth, async (req, res) => {
try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/user/profile
// @desc    Update user profile data
// @access  Private
router.put('/profile', auth, async (req, res) => {
  const { name, email, phone, emergencyPin, emergencyNumber, profileImage } = req.body;
  
  const profileFields = {};
  if (name) profileFields.name = name;
  if (email) profileFields.email = email;
  if (phone) profileFields.phone = phone;
  if (emergencyPin) profileFields.emergencyPin = emergencyPin;
  if (emergencyNumber) profileFields.emergencyNumber = emergencyNumber;
  if (profileImage !== undefined) profileFields.profileImage = profileImage;

  try {
    let user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: profileFields },
      { new: true, select: '-password' }
    );
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/user/contacts
// @desc    Update trusted contacts
// @access  Private
router.put('/contacts', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    user.trustedContacts = req.body.contacts; // Array of contacts
    await user.save();
    res.json(user.trustedContacts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/user/location
// @desc    Update last location
// @access  Private
router.put('/location', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    user.lastLocation = {
      lat: req.body.lat,
      lng: req.body.lng,
      timestamp: Date.now()
    };
    await user.save();
    res.json(user.lastLocation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/user/alerts
// @desc    Update alerts array
// @access  Private
router.put('/alerts', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    user.alerts = req.body.alerts; // Array of alerts
    await user.save();
    res.json(user.alerts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
