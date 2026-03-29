const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const Volunteer = require('./models/Volunteer');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/sos', require('./routes/sos'));
app.use('/api/volunteer', require('./routes/volunteer'));

// Serve static React files in production
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// API health endpoint (kept just in case)
app.get('/api', (req, res) => res.send('AstraSafe API Running'));

// Socket.io for community SOS broadcasting
io.on('connection', (socket) => {
  console.log('User connected to socket:', socket.id);
  
  socket.on('volunteer_join', (data) => {
     if (data && data.volunteerId) {
       socket.join('volunteer_' + data.volunteerId);
     }
  });
  
  socket.on('trigger_sos', async (data) => {
    // Broadcast to all other users
    socket.broadcast.emit('sos_alert', data);
    
    // Notify nearby active volunteers within 50km
    if (data.lat && data.lng) {
      try {
        const nearbyVolunteers = await Volunteer.find({
          isAvailable: true,
          location: {
            $near: {
              $geometry: {
                 type: "Point",
                 coordinates: [parseFloat(data.lng), parseFloat(data.lat)]
              },
              $maxDistance: 50000
            }
          }
        });
        
        console.log(`Found ${nearbyVolunteers.length} available volunteers nearby for SOS`);
        
        nearbyVolunteers.forEach(v => {
          io.to('volunteer_' + v._id.toString()).emit('volunteer_sos_alert', {
             ...data,
             alertId: new Date().getTime() + '_' + data.userId
          });
        });
      } catch (err) {
        console.error('Error finding nearby volunteers for SOS ($near):', err.message);
        
        // Fallback: Notify ALL available volunteers if index fails
        try {
          const allVolunteers = await Volunteer.find({ isAvailable: true });
          console.log(`Fallback: Found ${allVolunteers.length} active volunteers.`);
          allVolunteers.forEach(v => {
            io.to('volunteer_' + v._id.toString()).emit('volunteer_sos_alert', {
               ...data,
               alertId: new Date().getTime() + '_' + data.userId
            });
          });
        } catch (fbErr) {
          console.error("Fallback error:", fbErr);
        }
      }
    }
  });
  
  socket.on('accept_sos', (data) => {
    io.emit('sos_accepted', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Catch-all route for React Router: must be after API routes and Socket.io
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartsafety')
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));
