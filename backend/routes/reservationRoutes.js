// backend/routes/reservationRoutes.js
const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware');

// Semua rute ini akan dilindungi dan hanya untuk admin
router.use(verifyToken, authorizeRole(['admin']));

// Mendapatkan semua reservasi
router.get('/', reservationController.getAllReservations);

// Memperbarui status reservasi
router.put('/:id/status', reservationController.updateReservationStatus);

module.exports = router;