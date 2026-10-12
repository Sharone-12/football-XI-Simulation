const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const header = req.header('Authorization');
  if (!header) {
    return res.status(401).json({ error: 'No token provided, authorization denied' });
  }

  const token = header.startsWith('Bearer ') ? header.slice(7) : header;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
}

// Optional auth - attaches user if token present, but doesn't block
function optionalAuth(req, res, next) {
  const header = req.header('Authorization');
  if (!header) return next();

  const token = header.startsWith('Bearer ') ? header.slice(7) : header;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    // Token invalid, proceed without user
  }
  next();
}

module.exports = { auth, optionalAuth };
