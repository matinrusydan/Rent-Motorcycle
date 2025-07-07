// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); 
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware'); 
const upload = require('../middlewares/multerMiddleware'); // PASTIKAN JALUR INI BENAR

// --- RUTE PUBLIK (Tidak perlu autentikasi) ---
// Rute untuk registrasi user baru (dengan upload KTP)
router.post('/register', upload.single('foto_ktp'), authController.register);

// Rute untuk login user
router.post('/login', authController.login);

// Rute untuk memeriksa ketersediaan email
router.post('/check-email', authController.checkEmailAvailability);

// --- RUTE TERLINDUNGI (Membutuhkan autentikasi JWT) ---
// Contoh rute untuk mendapatkan profil user yang sudah login
router.get('/profile', verifyToken, authController.getProfile);

// --- RUTE ADMIN (Membutuhkan autentikasi JWT dan role 'admin') ---
// Mendapatkan semua pending users
router.get('/admin/pending-users', verifyToken, authorizeRole(['admin']), authController.getPendingUsers);

// Menyetujui user pending
router.post('/admin/approve-user/:id', verifyToken, authorizeRole(['admin']), authController.approveUser);

// Menolak user pending (menggunakan DELETE karena menghapus entri)
router.delete('/admin/reject-user/:id', verifyToken, authorizeRole(['admin']), authController.rejectUser);

// Mendapatkan semua pengguna (untuk admin) - Pindah ke sini untuk konsistensi
router.get('/admin/users', verifyToken, authorizeRole(['admin']), authController.getAllUsers); 

// Rute untuk mengubah status pengguna (aktif/nonaktif)
router.put('/admin/users/:id/status', verifyToken, authorizeRole(['admin']), async (req, res) => {
    const { id } = req.params;
    const { is_verified } = req.body; // Nilai boolean true/false dari frontend
    
    try {
        const db = require('../config/db'); 
        const connection = await db.getConnection();
        
        // Log untuk debugging: Menunjukkan ID user dan status yang diminta
        console.log(`DEBUG: Permintaan perubahan status untuk User ID: ${id}`);
        console.log(`DEBUG: Status is_verified yang diminta: ${is_verified} (boolean)`);

        // Check if user exists and is not an admin
        const [userRows] = await connection.execute(
            'SELECT id, role FROM users WHERE id = ?',
            [id]
        );
        
        if (userRows.length === 0) {
            connection.release();
            console.log(`DEBUG: User ID ${id} tidak ditemukan.`);
            return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
        }
        
        if (userRows[0].role === 'admin') {
            connection.release();
            console.log(`DEBUG: Mencoba mengubah status admin untuk User ID ${id}. Akses ditolak.`);
            return res.status(403).json({ success: false, message: 'Tidak dapat mengubah status admin.' });
        }
        
        // Update user status
        await connection.execute(
            'UPDATE users SET is_verified = ? WHERE id = ?',
            [is_verified, id]
        );
        
        connection.release();
        
        console.log(`DEBUG: User ID ${id} berhasil diubah statusnya menjadi is_verified: ${is_verified}.`);
        res.json({ 
            success: true, 
            message: `User berhasil ${is_verified ? 'diaktifkan' : 'dinonaktifkan'}.` 
        });
        
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: error.message });
    }
});


router.delete('/admin/users/:id', verifyToken, authorizeRole(['admin']), async (req, res) => {
    const { id } = req.params;
    
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
            return res.status(403).json({ success: false, message: 'Tidak dapat menghapus akun admin.' });
        }
        
        // Delete user
        await connection.execute('DELETE FROM users WHERE id = ?', [id]);
        
        connection.release();
        
        res.json({ success: true, message: 'User berhasil dihapus.' });
        
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: error.message });
    }
});


router.put('/admin/profile', verifyToken, authorizeRole(['admin']), authController.updateAdminProfile); 

module.exports = router;