const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartsafety';

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to MongoDB at', uri);
    const db = mongoose.connection;
    // Create a dummy collection and insert a document
    await db.collection('test_init').insertOne({ initialized: true, date: new Date() });
    console.log('Successfully inserted test document. The "smartsafety" database should now be visible in MongoDB Compass!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Connection error:', err);
    process.exit(1);
  });
