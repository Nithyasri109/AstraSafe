const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Volunteer = require('../models/Volunteer');

// Minimal inline auth middleware for Volunteer routes
// (Assumes JWT payload has { user: { id: "..." } } to match existing Auth logic)
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// @route   POST api/volunteer/register
router.post('/register', async (req, res) => {
  try {
    const { name, phone, email, password, preferredTime, emergencySkills, consent } = req.body;
    let volunteer = await Volunteer.findOne({ phone });
    if (volunteer) return res.status(400).json({ msg: 'Volunteer with this phone number already exists' });

    volunteer = new Volunteer({
      name,
      phone,
      email,
      password,
      preferredTime: preferredTime || 'Both',
      emergencySkills: emergencySkills || [],
      consent
    });

    const salt = await bcrypt.genSalt(10);
    volunteer.password = await bcrypt.hash(password, salt);
    await volunteer.save();

    const payload = { user: { id: volunteer.id, role: 'volunteer' } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
      if (err) throw err;
      res.json({ token, volunteer: { id: volunteer.id, name: volunteer.name, phone: volunteer.phone } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/volunteer/login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    // Support logging in by email or phone
    let volunteer = await Volunteer.findOne({
      $or: [
        { phone: identifier },
        { email: identifier }
      ]
    });
    
    if (!volunteer) return res.status(400).json({ msg: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, volunteer.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    const payload = { user: { id: volunteer.id, role: 'volunteer' } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
      if (err) throw err;
      res.json({ token, volunteer: { id: volunteer.id, name: volunteer.name, phone: volunteer.phone } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/volunteer/status
// @desc    Update volunteer availability and location
router.put('/status', auth, async (req, res) => {
  try {
    const { isAvailable, lat, lng } = req.body;
    
    // Find Volunteer
    const volunteer = await Volunteer.findById(req.user.id);
    if (!volunteer) return res.status(404).json({ msg: 'Volunteer not found' });
    
    if (typeof isAvailable === 'boolean') {
      volunteer.isAvailable = isAvailable;
    }
    
    if (lat !== undefined && lng !== undefined) {
      volunteer.location = {
        type: 'Point',
        coordinates: [lng, lat] // [longitude, latitude]
      };
    }
    
    await volunteer.save();
    res.json(volunteer);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/volunteer/nearby
// @desc    Find active volunteers near a location (within distance meters). Max 5000m.
// @access  Public (so users can query) or Auth (users auth token)
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, distance = 2000 } = req.query; // default 2km
    if (!lat || !lng) return res.status(400).json({ msg: 'Latitude and longitude required' });

    const parsedDistance = parseInt(distance, 10);

    const volunteers = await Volunteer.find({
      isAvailable: true,
      location: {
        $near: {
          $geometry: {
             type: "Point",
             coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parsedDistance
        }
      }
    }).select('-password -email'); // Exclude sensitive info
    
    res.json(volunteers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/volunteer/data
// @desc    Get current volunteer data
router.get('/data', auth, async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.user.id).select('-password');
    res.json(volunteer);
  } catch(err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
