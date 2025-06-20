// backend/models/Reservation.js
const db = require('../config/db');

class Reservation {
    static async findAll(filters = {}) {
        let query = `
            SELECT 
                r.id, r.user_id, r.motor_id, r.tanggal_sewa, r.lama_sewa_hari, r.total_harga, r.status, r.catatan, r.created_at,
                u.nama_lengkap, u.email, u.no_hp,
                m.brand as motor_brand, m.type as motor_type, m.specs as motor_specs, m.gambar_motor as motor_image
            FROM reservasi r
            JOIN users u ON r.user_id = u.id
            JOIN motors m ON r.motor_id = m.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.search) {
            query += ' AND (u.nama_lengkap LIKE ? OR u.email LIKE ? OR u.no_hp LIKE ? OR m.brand LIKE ? OR m.type LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }
        if (filters.status && filters.status !== 'all') {
            query += ' AND r.status = ?';
            params.push(filters.status);
        }

        query += ' ORDER BY r.created_at DESC';

        // Filter dan pagination bisa ditambahkan lebih lanjut jika diperlukan

        const [rows] = await db.query(query, params);
        return rows;
    }

    static async updateStatus(reservationId, newStatus) {
        const [result] = await db.query('UPDATE reservasi SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatus, reservationId]);
        return result.affectedRows > 0;
    }

    // Fungsi lain seperti create, findById, delete bisa ditambahkan di sini jika diperlukan
    // Contoh:
    /*
    static async create(reservationData) {
        const { user_id, motor_id, tanggal_sewa, lama_sewa_hari, total_harga, catatan } = reservationData;
        const [result] = await db.query(
            'INSERT INTO reservasi (user_id, motor_id, tanggal_sewa, lama_sewa_hari, total_harga, catatan) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, motor_id, tanggal_sewa, lama_sewa_hari, total_harga, catatan]
        );
        return result.insertId;
    }
    */
}

module.exports = Reservation;