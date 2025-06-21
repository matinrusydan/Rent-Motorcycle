// backend/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware');

router.get('/stats', verifyToken, authorizeRole(['admin']), dashboardController.getDashboardStats);

module.exports = router;