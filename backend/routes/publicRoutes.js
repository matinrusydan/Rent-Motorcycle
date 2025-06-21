// backend/routes/publicRoutes.js (BERKAS BARU)
const express = require('express');
const router = express.Router();
const motorController = require('../controllers/motorController');
const testimonialController = require('../controllers/testimonialController');
const reservationController = require('../controllers/reservationController'); // Impor controller reservasi
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware'); // Pastikan ini diimpor jika belum


// --- RUTE PUBLIK (Tidak perlu autentikasi JWT atau role) ---

// Mendapatkan semua motor yang tersedia untuk publik
router.get('/motors/available', motorController.getAvailableMotors);
router.get('/motors/:motorId/availability', motorController.getMotorAvailability);

// Mendapatkan semua testimoni yang disetujui (untuk publik)
router.get('/testimonials/approved', testimonialController.getApprovedTestimonials);

// Mengirim testimoni baru (membutuhkan user_id, jadi pengguna harus login)
// Rute ini bisa saja dilindungi oleh verifyToken jika Anda hanya ingin user login yang bisa submit
// Untuk saat ini, kita asumsikan user_id dikirim dari frontend setelah login
router.post('/testimonials', testimonialController.createTestimonial);

router.get('/available', motorController.getAvailableMotors);
router.get('/:id/availability', motorController.getMotorAvailabilityDetails);

// Membuat reservasi baru (membutuhkan user_id, jadi pengguna harus login)
// Rute ini bisa saja dilindungi oleh verifyToken jika Anda hanya ingin user login yang bisa buat
router.post('/reservations', reservationController.createReservation);

router.get('/reservations/:id', verifyToken, authorizeRole(['user', 'admin']), reservationController.getReservationById);

module.exports = router;