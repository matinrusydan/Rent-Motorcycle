// backend/routes/reservationRoutes.js
const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware');

// Rute untuk mendapatkan semua reservasi (hanya admin)
router.get('/', verifyToken, authorizeRole(['admin']), reservationController.getAllReservations); // <<< PASTIKAN INI BENAR

// Rute untuk mendapatkan detail reservasi berdasarkan ID (ini yang di userRoutes.js)
// router.get('/:id', verifyToken, authorizeRole(['admin', 'user']), reservationController.getReservationById); // Ini harus dikomentari/dihapus

// Rute untuk memperbarui status reservasi (hanya admin)
router.put('/:id/status', verifyToken, authorizeRole(['admin']), reservationController.updateReservationStatus);

module.exports = router;