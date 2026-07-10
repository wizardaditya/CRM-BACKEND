const jwt = require('jsonwebtoken');

const JWT_SECRET          = process.env.JWT_SECRET;
const JWT_EXPIRES_IN      = process.env.JWT_EXPIRES_IN          || '15m';
const JWT_REFRESH_SECRET  = process.env.JWT_REFRESH_SECRET;
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN  || '7d';

/**
 * Sign a short-lived access token
 */
const signAccessToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

/**
 * Sign a long-lived refresh token
 */
const signRefreshToken = (payload) =>
  jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES });

/**
 * Verify access token — throws on invalid/expired
 */
const verifyAccessToken = (token) =>
  jwt.verify(token, JWT_SECRET);

/**
 * Verify refresh token — throws on invalid/expired
 */
const verifyRefreshToken = (token) =>
  jwt.verify(token, JWT_REFRESH_SECRET);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
