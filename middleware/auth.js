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
 * Dynamic permission guard - simplified to role-based access for now
 * Usage: requirePermission('leads:create')
 */
const requirePermission = (permissionName) => (req, res, next) => {
  // For now, allow ADMIN and CEO full access, others based on basic role permissions
  const { role } = req.user || {};
  
  if (role === 'ADMIN' || role === 'CEO') {
    return next();
  }
  
  // Basic role-based permissions
  const allowedRoles = {
    'leads:create': ['SALES_MANAGER', 'SALES_EXECUTIVE'],
    'leads:read': ['SALES_MANAGER', 'SALES_EXECUTIVE', 'MARKETING_MANAGER'],
    'leads:update': ['SALES_MANAGER', 'SALES_EXECUTIVE'],
    'leads:delete': ['SALES_MANAGER'],
    'tasks:create': ['SALES_MANAGER', 'SALES_EXECUTIVE'],
    'tasks:update': ['SALES_MANAGER', 'SALES_EXECUTIVE'],
  };
  
  const allowed = allowedRoles[permissionName] || [];
  
  if (!allowed.includes(role)) {
    return forbidden(res, `Permission denied: ${permissionName}`);
  }
  
  next();
};

module.exports = { protect, authorize, requirePermission };
