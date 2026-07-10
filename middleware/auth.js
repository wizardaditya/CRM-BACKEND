const { verifyAccessToken } = require('../config/jwt');
const { unauthorized, forbidden } = require('../utils/apiResponse');
const prisma = require('../config/db');

/**
 * Protect routes — verifies JWT from Authorization header or httpOnly cookie
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) return unauthorized(res, 'No token provided');

    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true, name: true, email: true,
        role: true, isActive: true, avatar: true,
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!user)          return unauthorized(res, 'User not found');
    if (!user.isActive) return forbidden(res, 'Account is deactivated');

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return unauthorized(res, 'Token expired');
    return unauthorized(res, 'Invalid token');
  }
};

/**
 * Role-based access guard
 * Usage: authorize('ADMIN', 'SALES_MANAGER')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return forbidden(res, 'You do not have permission to perform this action');
  }
  next();
};

/**
 * Dynamic permission guard
 * Usage: requirePermission('leads:create')
 */
const requirePermission = (permissionName) => (req, res, next) => {
  const hasPermission = req.user?.permissions?.some(
    (up) => up.permission.name === permissionName && up.granted
  );
  if (!hasPermission) {
    return forbidden(res, `Permission denied: ${permissionName}`);
  }
  next();
};

module.exports = { protect, authorize, requirePermission };
