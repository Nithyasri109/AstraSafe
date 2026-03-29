const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  trustedContacts: [{
    id: String,
    name: String,
    phone: String
  }],
  emergencyPin: {
    type: String,
    default: '1234'
  },
  emergencyNumber: {
    type: String,
    default: '112'
  },
  profileImage: {
    type: String,
    default: ''
  },
  lastLocation: {
    lat: { type: Number },
    lng: { type: Number },
    timestamp: { type: Date, default: Date.now }
  },
  alerts: [{
    timestamp: String,
    locationUrl: String,
    contactsCount: Number
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
