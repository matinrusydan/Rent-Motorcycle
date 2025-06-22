// backend/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        console.log('DEBUG: Token null atau tidak ada. Mengembalikan 401.');
        return res.status(401).json({ message: 'Akses ditolak. Token tidak disediakan.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log('DEBUG: Verifikasi token gagal. Error:', err.message);
            // Perhatikan: Terkadang, ini bisa mengirim 403 alih-alih 401
            return res.status(403).json({ message: 'Token tidak valid atau kedaluwarsa.' });
        }
        req.user = user;
        console.log('DEBUG: Token berhasil diverifikasi. req.user:', req.user);
        next();
    });
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