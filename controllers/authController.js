const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return errorResponse(res, 'Email already registered', 409);
    }

    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, rounds);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: role || 'SALES', phone },
      select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
    });

    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return successResponse(res, { user, accessToken, refreshToken }, 'Registration successful', 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true, name: true, email: true, role: true, phone: true,
        avatar: true, isActive: true, password: true,
      },
    });

    if (!user) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Account is deactivated. Contact admin.', 403);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    const { password: _, ...userWithoutPassword } = user;
    return successResponse(res, { user: userWithoutPassword, accessToken, refreshToken }, 'Login successful');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/auth/refresh
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return errorResponse(res, 'Refresh token required', 401);

    const decoded = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, refreshToken: true, isActive: true },
    });

    if (!user || user.refreshToken !== token) {
      return errorResponse(res, 'Invalid refresh token', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Account is deactivated', 403);
    }

    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const newRefreshToken = generateRefreshToken({ id: user.id });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    return successResponse(res, { accessToken, refreshToken: newRefreshToken }, 'Token refreshed');
  } catch (error) {
    return errorResponse(res, 'Invalid or expired refresh token', 401);
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { refreshToken: null },
    });
    return successResponse(res, null, 'Logged out successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, role: true,
        phone: true, avatar: true, isActive: true, createdAt: true,
      },
    });
    return successResponse(res, user, 'User profile fetched');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = { register, login, refreshToken, logout, getMe };
