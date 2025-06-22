    // backend/routes/testimonialRoutes.js
    const express = require('express');
    const router = express.Router();
    const testimonialController = require('../controllers/testimonialController');
    const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware');


    router.get('/', verifyToken, authorizeRole(['admin']), testimonialController.getAllTestimonialsAdmin); 
    router.put('/:id/status', verifyToken, authorizeRole(['admin']), testimonialController.updateTestimonialStatus); 

    // Rute baru untuk menghapus testimoni (Hanya untuk admin)
    router.delete('/:id', verifyToken, authorizeRole(['admin']), testimonialController.deleteTestimonial);

    module.exports = router;
    