require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

const { prisma } = require('./lib/prisma');


// Import Routes
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');


const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser());


// Mount User API Routes
app.use('/api/users', userRoutes);
app.use('/auth', authRoutes);
app.use('/userImages', express.static(path.join(__dirname, 'public', 'userImages')));


// Simple Health Check Route
app.get('/health', (req, res) => {
  res.json({ status: "OK", message: "Express server is running perfectly." });
});


app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});


// Match the port exposed in docker-compose.yml
const PORT = process.env.PORT || 5175;


async function testConnection() {
  await prisma.$queryRaw`SELECT 1`;
  console.log('Database connected');
}


async function startServer() {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`Express server run on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}


startServer();