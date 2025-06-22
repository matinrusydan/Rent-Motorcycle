    // backend/routes/adminRoutes.js
    const express = require('express');
    const router = express.Router();
    const authController = require('../controllers/authController'); 
    const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware'); 

    // All routes here are prefixed with /api/admin
    // and require admin authorization

    // Get all users (Rute ini sudah ada di authRoutes, jadi bisa dihapus di sini untuk menghindari duplikasi)
    // router.get('/users', verifyToken, authorizeRole(['admin']), authController.getAllUsers);

    // Update user status (activate/deactivate)
    router.put('/users/:id/status', verifyToken, authorizeRole(['admin']), async (req, res) => {
        const { id } = req.params;
        const { is_verified } = req.body;
        
        try {
            const db = require('../config/db');
            const connection = await db.getConnection();
            
            // Check if user exists and is not an admin
            const [userRows] = await connection.execute(
                'SELECT id, role FROM users WHERE id = ?',
                [id]
            );
            
            if (userRows.length === 0) {
                connection.release();
                return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
            }
            
            if (userRows[0].role === 'admin') {
                connection.release();
                return res.status(403).json({ success: false, message: 'Tidak dapat mengubah status admin.' });
            }
            
            // Update user status
            await connection.execute(
                'UPDATE users SET is_verified = ? WHERE id = ?',
                [is_verified, id]
            );
            
            connection.release();
            
            res.json({ 
                success: true, 
                message: `User berhasil ${is_verified ? 'diaktifkan' : 'dinonaktifkan'}.` 
            });
            
        } catch (error) {
            console.error('Error updating user status:', error);
            res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: error.message });
        }
    });

    // Delete user (akan dipindahkan ke authRoutes.js)
    // router.delete('/users/:id', verifyToken, authorizeRole(['admin']), async (req, res) => { /* ... */ });

    // Get all pending users
    router.get('/pending-users', verifyToken, authorizeRole(['admin']), authController.getPendingUsers);

    // Approve pending user
    router.post('/approve-user/:id', verifyToken, authorizeRole(['admin']), authController.approveUser);

    // Reject pending user
    router.delete('/reject-user/:id', verifyToken, authorizeRole(['admin']), authController.rejectUser);

    module.exports = router;