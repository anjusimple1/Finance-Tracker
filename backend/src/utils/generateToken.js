const jwt = require('jsonwebtoken');

/**
 * Create a signed JWT for the given user id (used after login/register in Step 2).
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

module.exports = generateToken;
