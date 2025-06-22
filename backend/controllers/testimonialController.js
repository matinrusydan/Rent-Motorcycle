// backend/controllers/testimonialController.js
const Testimonial = require('../models/Testimonial');
const db = require('../config/db'); 

const getApprovedTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.findAllApproved();
        res.json({ success: true, data: testimonials, message: 'Approved testimonials retrieved successfully.' });
    } catch (error) {
        console.error('Error in getApprovedTestimonials:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve approved testimonials.', error: error.message });
    }
};


const createTestimonial = async (req, res) => {
    try {
        const { user_id, content, rating } = req.body; 

        if (!user_id || !content || !rating) {
            return res.status(400).json({ success: false, message: 'User ID, content, and rating are required.' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
        }

        const newTestimonialId = await Testimonial.create({ user_id, content, rating });
        res.status(201).json({ success: true, message: 'Testimonial successfully submitted and awaiting approval.', testimonialId: newTestimonialId });
    } catch (error) {
        console.error('Error in createTestimonial:', error);
        res.status(500).json({ success: false, message: 'Failed to submit testimonial.', error: error.message });
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
        res.status(500).json({ success: false, message: 'Failed to retrieve testimonial data for admin.', error: error.message });
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
            return res.status(400).json({ success: false, message: 'Invalid status.' });
        }

        connection = await db.getConnection();
        await connection.execute(
            'UPDATE testimoni SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status.toLowerCase(), id]
        );
        res.json({ success: true, message: `Testimonial status ${id} successfully changed to ${status}.` });
    } catch (error) {
        console.error('Error updating testimonial status:', error);
        res.status(500).json({ success: false, message: 'An error occurred while updating testimonial status.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// Fungsi baru: Menghapus testimoni
const deleteTestimonial = async (req, res) => {
    let connection;
    try {
        const { id } = req.params; // ID testimoni yang akan dihapus

        connection = await db.getConnection();

        // Periksa apakah testimoni ada
        const [rows] = await connection.execute(
            'SELECT id FROM testimoni WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Testimonial not found.' });
        }

        // Hapus testimoni dari database
        await connection.execute(
            'DELETE FROM testimoni WHERE id = ?',
            [id]
        );

        res.json({ success: true, message: `Testimonial ${id} successfully deleted.` });
    } catch (error) {
        console.error('Error deleting testimonial:', error);
        res.status(500).json({ success: false, message: 'An error occurred while deleting the testimonial.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};


module.exports = {
    getApprovedTestimonials,
    createTestimonial,
    getAllTestimonialsAdmin, 
    updateTestimonialStatus,
    deleteTestimonial // <-- Tambahkan fungsi baru di sini
};
