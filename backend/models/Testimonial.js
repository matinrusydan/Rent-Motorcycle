// backend/models/Testimonial.js
const db = require('../config/db');

class Testimonial {
    static async findAllApproved() {
        const [rows] = await db.query(
            `SELECT t.id, t.content, t.rating, t.created_at, u.nama_lengkap as user_name, u.email as user_email
             FROM testimoni t
             JOIN users u ON t.user_id = u.id
             WHERE t.status = 'approved'
             ORDER BY t.created_at DESC`
        );
        return rows;
    }

    static async create(testimonialData) {
        const { user_id, content, rating } = testimonialData;
        const [result] = await db.query(
            'INSERT INTO testimoni (user_id, content, rating, status) VALUES (?, ?, ?, ?)',
            [user_id, content, rating, 'pending'] // Default status 'pending' untuk moderasi
        );
        return result.insertId;
    }

    // Fungsi lain untuk admin (misal: findAll, updateStatus, delete) bisa ditambahkan di sini
    static async findAll(filters = {}) {
        let query = `
            SELECT t.id, t.content, t.rating, t.status, t.created_at, u.nama_lengkap as user_name, u.email as user_email
            FROM testimoni t
            JOIN users u ON t.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.status && filters.status !== 'all') {
            query += ' AND t.status = ?';
            params.push(filters.status);
        }
        if (filters.search) {
            query += ' AND (t.content LIKE ? OR u.nama_lengkap LIKE ? OR u.email LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY t.created_at DESC';
        const [rows] = await db.query(query, params);
        return rows;
    }

    static async updateStatus(id, newStatus) {
        const [result] = await db.query('UPDATE testimoni SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatus, id]);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM testimoni WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Testimonial;