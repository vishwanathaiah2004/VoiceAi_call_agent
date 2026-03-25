const jwt = require('jsonwebtoken');

// Standard user auth — injects req.user + req.tenantId
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    req.tenantId = req.user.tenantId; // Every request is scoped to a tenant
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Super admin only (platform owner — you)
function superAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'superadmin') return res.status(403).json({ error: 'Super admin only' });
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ error: 'Invalid token' });
  }
}

// Admin within a tenant
function tenantAdmin(req, res, next) {
  if (!['admin', 'owner'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Tenant admin required' });
  }
  next();
}

module.exports = { auth, superAdmin, tenantAdmin };
