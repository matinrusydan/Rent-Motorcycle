// backend/routes/publicRoutes.js (BERKAS BARU)
const express = require('express');
const router = express.Router();
const motorController = require('../controllers/motorController');
const testimonialController = require('../controllers/testimonialController');
const reservationController = require('../controllers/reservationController'); // Impor controller reservasi
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware'); // Pastikan ini diimpor jika belum


router.get('/motors/available', motorController.getAvailableMotors);
router.get('/motors/:motorId/availability', motorController.getMotorAvailability);
router.get('/testimonials/approved', testimonialController.getApprovedTestimonials);
router.post('/testimonials', testimonialController.createTestimonial);
router.get('/available', motorController.getAvailableMotors);
router.get('/:id/availability', motorController.getMotorAvailabilityDetails);
router.post('/reservations', reservationController.createReservation);
router.get('/reservations/:id', verifyToken, authorizeRole(['user', 'admin']), reservationController.getReservationById);

module.exports = router;