// backend/routes/reservationRoutes.js
const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, authorizeRole(['admin']), reservationController.getAllReservations); // <<< PASTIKAN INI BENAR

router.put('/:id/status', verifyToken, authorizeRole(['admin']), reservationController.updateReservationStatus);

module.exports = router;