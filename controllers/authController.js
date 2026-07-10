const bcrypt      = require('bcryptjs');
const prisma      = require('../config/db');
const authService = require('../services/authService');
const R           = require('../utils/apiResponse');

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
};

exports.register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    R.created(res, user, 'User registered successfully');
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { accessToken, refreshToken, user } = await authService.login(req.body);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);
    R.success(res, { accessToken, user }, 'Login successful');
  } catch (err) { next(err); }
};

exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const { accessToken, refreshToken } = await authService.refreshToken(token);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);
    R.success(res, { accessToken }, 'Token refreshed');
  } catch (err) { next(err); }
};

exports.logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    res.clearCookie('refreshToken');
    R.success(res, null, 'Logged out successfully');
  } catch (err) { next(err); }
};

exports.me = async (req, res) => {
  const { password, refreshToken, resetToken, ...user } = req.user;
  R.success(res, user, 'User profile');
};

exports.forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    R.success(res, null, 'If the email exists, a reset link has been sent');
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExp: { gt: new Date() } },
    });
    if (!user) return R.error(res, 'Invalid or expired reset token', 400);

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data:  { password: hashed, resetToken: null, resetTokenExp: null },
    });
    R.success(res, null, 'Password reset successfully');
  } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return R.error(res, 'Current password is incorrect', 400);

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    R.success(res, null, 'Password changed successfully');
  } catch (err) { next(err); }
};
