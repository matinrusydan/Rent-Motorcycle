// backend/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/multerMiddleware'); // Pastikan jalur ini benar untuk upload file

// Rute untuk mengunggah bukti pembayaran (hanya user yang login)
// Asumsi ini rute untuk user yang sudah login, jadi dilindungi verifyToken
router.post('/upload-proof', verifyToken, upload.single('buktiPembayaran'), paymentController.uploadPaymentProof);

// --- Rute Admin (Membutuhkan autentikasi JWT dan role 'admin') ---
// Mendapatkan semua data pembayaran
router.get('/', verifyToken, authorizeRole(['admin']), paymentController.getAllPayments);

// Memperbarui status pembayaran (admin)
router.put('/:id/status', verifyToken, authorizeRole(['admin']), paymentController.updatePaymentStatus);


module.exports = router;