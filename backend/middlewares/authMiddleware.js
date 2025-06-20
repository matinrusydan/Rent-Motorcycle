// backend/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Access denied: No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access denied: Invalid token format.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token.', error: error.message });
    }
};

const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ message: 'Access denied: Role information not available.' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied: Insufficient permissions.' });
        }
        next();
    };
};

module.exports = { verifyToken, authorizeRole };