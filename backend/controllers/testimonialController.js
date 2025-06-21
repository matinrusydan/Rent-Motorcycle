// backend/controllers/testimonialController.js
const Testimonial = require('../models/Testimonial');
const db = require('../config/db'); 

const getApprovedTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.findAllApproved();
        res.json({ success: true, data: testimonials, message: 'Approved testimonials retrieved successfully.' });
    } catch (error) {
        console.error('Error in getApprovedTestimonials:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil testimoni yang disetujui.', error: error.message });
    }
};


const createTestimonial = async (req, res) => {
    try {
        const { user_id, content, rating } = req.body; 

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


const getAllTestimonialsAdmin = async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const [rows] = await connection.execute(
            `SELECT
                t.id,
                t.user_id,
                t.content,
                t.rating,
                t.status,
                t.created_at,
                t.updated_at,
                u.nama_lengkap AS user_nama_lengkap,
                u.email AS user_email
            FROM testimoni t
            JOIN users u ON t.user_id = u.id
            ORDER BY t.created_at DESC`
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error in getAllTestimonialsAdmin:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data testimoni untuk admin.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};


const updateTestimonialStatus = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = ['pending', 'approved', 'rejected'];

        if (!status || !validStatuses.includes(status.toLowerCase())) {
            return res.status(400).json({ success: false, message: 'Status tidak valid.' });
        }

        connection = await db.getConnection();
        await connection.execute(
            'UPDATE testimoni SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status.toLowerCase(), id]
        );
        res.json({ success: true, message: `Status testimoni ${id} berhasil diubah menjadi ${status}.` });
    } catch (error) {
        console.error('Error updating testimonial status:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat memperbarui status testimoni.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};


module.exports = {
    getApprovedTestimonials,
    createTestimonial,
    getAllTestimonialsAdmin, 
    updateTestimonialStatus 
};