// backend/routes/motorRoutes.js
const express = require('express');
const router = express.Router();
const motorController = require('../controllers/motorController');
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/multerMiddleware');

// Apply middleware to all routes
router.use(verifyToken, authorizeRole(['admin']));

// Routes in correct order - specific routes BEFORE parameterized routes
router.get('/stats', motorController.getMotorStats);
router.delete('/bulk-delete', motorController.bulkDeleteMotors);
router.get('/', motorController.getAllMotors);
router.post('/', upload.single('gambar_motor'), motorController.createMotor);
router.get('/:id', motorController.getMotorById);
router.put('/:id', upload.single('gambar_motor'), motorController.updateMotor);
router.delete('/:id', motorController.deleteMotor);
router.get('/:id/future-reservations', motorController.checkMotorFutureReservations);

module.exports = router;