// backend/controllers/testimonialController.js
const Testimonial = require('../models/Testimonial');

// Mengambil semua testimoni yang disetujui (untuk publik)
const getApprovedTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.findAllApproved();
        res.json({ success: true, data: testimonials, message: 'Approved testimonials retrieved successfully.' });
    } catch (error) {
        console.error('Error in getApprovedTestimonials:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil testimoni yang disetujui.', error: error.message });
    }
};

// Mengirim testimoni baru (dari user)
const createTestimonial = async (req, res) => {
    try {
        const { user_id, content, rating } = req.body; // user_id dari req.user jika ada middleware auth

        if (!user_id || !content || !rating) {
            return res.status(400).json({ success: false, message: 'User ID, konten, dan rating wajib diisi.' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating harus antara 1 dan 5.' });
        }

        const newTestimonialId = await Testimonial.create({ user_id, content, rating });
        res.status(201).json({ success: true, message: 'Testimoni berhasil dikirim dan menunggu persetujuan.', testimonialId: newTestimonialId });
    } catch (error) {
        console.error('Error in createTestimonial:', error);
        res.status(500).json({ success: false, message: 'Gagal mengirim testimoni.', error: error.message });
    }
};

module.exports = {
    getApprovedTestimonials,
    createTestimonial
};