const express = require('express');
const next = require('next');
const cors = require('cors');
require('dotenv').config();

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // Middleware
  server.use(cors());
  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));

  // Import API routes
  const moviesRoutes = require('./routes/movies');
  const usersRoutes = require('./routes/users');
  const reviewsRoutes = require('./routes/reviews');
  const authRoutes = require('./routes/auth');

  // Mount API routes
  server.use('/api/movies', moviesRoutes);
  server.use('/api/users', usersRoutes);
  server.use('/api/reviews', reviewsRoutes);
  server.use('/api/auth', authRoutes);

  // Handle Next.js pages - catch all routes not handled by API
  server.use((req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Express server ready on http://localhost:${PORT}`);
    console.log(`> API routes available at http://localhost:${PORT}/api`);
  });
}).catch((ex) => {
  console.error(ex.stack);
  process.exit(1);
});

