// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); 
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware'); 
const upload = require('../middlewares/multerMiddleware'); // ✅ PASTIKAN JALUR INI BENAR

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

// ✅ Rute baru: Mendapatkan semua pengguna (untuk admin)
router.get('/admin/users', verifyToken, authorizeRole(['admin']), authController.getAllUsers); 

router.put('/admin/profile', verifyToken, authorizeRole(['admin']), authController.updateAdminProfile); 

module.exports = router;