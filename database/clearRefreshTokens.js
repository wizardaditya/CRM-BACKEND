/**
 * Clear all refresh tokens to fix stale token issues after schema changes
 */
require('dotenv').config();
const prisma = require('../config/db');

const clearRefreshTokens = async () => {
  try {
    console.log('Clearing all refresh tokens...');
    
    const result = await prisma.user.updateMany({
      data: {
        refreshToken: null,
      },
    });

    console.log(`✅ Cleared refresh tokens for ${result.count} users`);
    console.log('Users will need to login again to get new tokens');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing refresh tokens:', error);
    process.exit(1);
  }
};

clearRefreshTokens();