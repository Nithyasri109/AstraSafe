const mongoose = require('mongoose');

const VolunteerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: false
  },
  password: {
    type: String,
    required: true
  },
  // GeoJSON Point for 2dsphere indexing
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  isAvailable: {
    type: Boolean,
    default: false
  },
  preferredTime: {
    type: String,
    enum: ['Day', 'Night', 'Both'],
    default: 'Both'
  },
  idProofUrl: {
    type: String,
    required: false
  },
  emergencySkills: [{
    type: String
  }],
  consent: {
    type: Boolean,
    required: true,
    default: true
  }
}, { timestamps: true });

// Create a 2dsphere index for location-based querying
VolunteerSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Volunteer', VolunteerSchema);
