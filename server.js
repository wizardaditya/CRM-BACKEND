/**
 * A5X CRM — Express Server Entry Point
 */
require('dotenv').config();

const express      = require('express');
const http         = require('http');
const { Server }   = require('socket.io');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const path         = require('path');

const routes                         = require('./routes');
const { initSocket }                 = require('./socket/socketHandler');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const logger                         = require('./utils/logger');

const app    = express();
const server = http.createServer(app);

// ─── CORS origins ─────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  // All Vercel deployments for this project
  'https://crm-frontend-tan-six.vercel.app',
  // Allow any vercel.app subdomain dynamically
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, mobile apps, curl)
    if (!origin) return callback(null, true);
    // Allow any vercel.app domain or localhost
    if (
      allowedOrigins.includes(origin) ||
      /^https:\/\/.*\.vercel\.app$/.test(origin) ||
      /^http:\/\/localhost:\d+$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(new Error('CORS not allowed: ' + origin), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
};

// ─── Socket.io ───────────────────────────────
const io = new Server(server, {
  cors: corsOptions,
});
initSocket(io);

// Attach io to req so controllers can emit events
app.set('io', io);

// ─── Security Middleware ──────────────────────
app.use(helmet());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight for all routes

// ─── Parsing Middleware ───────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Logging ─────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Static files (uploaded attachments) ─────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Health check ────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ─── API Routes ───────────────────────────────
app.use('/api/v1', routes);

// ─── 404 + Error handlers ────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start ────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚀 A5X CRM backend running on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = { app, server };