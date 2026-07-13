const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const userRepository = require('../repositories/userRepository');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { sendMail } = require('../config/mailer');
const logger = require('../utils/logger');

const authService = {
  /**
   * Register a new user (admin use only in Phase 1)
   */
  register: async ({ name, email, password, role }) => {
    const existing = await userRepository.findByEmail(email);
    if (existing) throw Object.assign(new Error('Email already registered'), { statusCode: 409 });

    const hashed = await bcrypt.hash(password, 12);
    const user = await userRepository.create({ name, email, password: hashed, role });

    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  /**
   * Login — returns accessToken + sets refresh in DB
   */
  login: async ({ email, password }) => {
    const user = await userRepository.findByEmail(email);
    if (!user || !user.isActive) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Update refresh token and last login in single query
    await userRepository.update(user.id, {
      refreshToken,
      lastLogin: new Date(),
    });

    const { password: _, refreshToken: __, ...safeUser } = user;
    return { accessToken, refreshToken, user: safeUser };
  },

  /**
   * Refresh access token
   */
  refreshToken: async (token) => {
    if (!token) throw Object.assign(new Error('Refresh token required'), { statusCode: 401 });

    let decoded;
    try { decoded = verifyRefreshToken(token); }
    catch { throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 }); }

    const user = await userRepository.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      throw Object.assign(new Error('Refresh token reuse detected'), { statusCode: 401 });
    }

    const payload      = { id: user.id, email: user.email, role: user.role };
    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await userRepository.update(user.id, { refreshToken });
    return { accessToken, refreshToken };
  },

  /**
   * Logout — invalidates refresh token
   */
  logout: async (userId) => {
    await userRepository.update(userId, { refreshToken: null });
  },

  /**
   * Forgot password — sends reset link
   */
  forgotPassword: async (email) => {
    const user = await userRepository.findByEmail(email);
    if (!user) return; // silent — do not reveal whether email exists

    const token    = crypto.randomBytes(32).toString('hex');
    const expiry   = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await userRepository.update(user.id, { resetToken: token, resetTokenExp: expiry });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await sendMail({
      to:      email,
      subject: 'A5X CRM — Password Reset',
      html:    `<p>Hi ${user.name},</p>
                <p>Click below to reset your password (expires in 1 hour):</p>
                <a href="${resetUrl}">${resetUrl}</a>
                <p>If you did not request this, ignore this email.</p>`,
    });

    logger.info(`Password reset email sent to ${email}`);
  },

  /**
   * Reset password with token
   */
  resetPassword: async ({ token, newPassword }) => {
    const user = await userRepository.findByEmail(
      // We need to find by reset token, not email
      // Use a direct prisma call here
    );
    // handled inside controller via direct prisma query
  },
};

module.exports = authService;
