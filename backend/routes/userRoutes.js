// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware'); // <<< PASTIKAN INI ADA
const authController = require('../controllers/authController'); // Untuk /profile
const reservationController = require('../controllers/reservationController'); // <<< PASTIKAN INI ADA

// Rute untuk mendapatkan profil user yang sudah login
router.get('/profile', verifyToken, authController.getProfile);
router.get('/reservations/:id', verifyToken, authorizeRole(['user', 'admin']), reservationController.getReservationById); // <<< PASTIKAN BARIS INI ADA DAN BENAR

module.exports = router;