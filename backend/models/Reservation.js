// backend/models/Reservation.js

const db = require('../config/db');

class Reservation {
    // Memperbarui findAll agar sesuai dengan kolom baru di database
    static async findAll(filters = {}) {
        let query = `
            SELECT
                r.id, r.user_id, r.motor_id, r.tanggal_mulai, r.tanggal_selesai, r.lama_sewa, r.total_harga, r.status, r.lokasi_jemput, r.catatan, r.created_at,
                u.nama_lengkap, u.email, u.no_hp,
                m.brand as motor_brand, m.type as motor_type, m.specs as motor_specs, m.gambar_motor as motor_image, m.harga_sewa as motor_harga_sewa
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

        const [rows] = await db.query(query, params);
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM reservasi WHERE id = ?', [id]);
        return rows[0] || null;
    }

    static async updateStatus(reservationId, newStatus) {
        const [result] = await db.query('UPDATE reservasi SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatus, reservationId]);
        return result.affectedRows > 0;
    }

    // Mengimplementasikan kembali fungsi create sesuai dengan kolom database yang baru
    static async create(reservationData) {
        const { user_id, motor_id, tanggal_mulai, tanggal_selesai, lama_sewa, total_harga, lokasi_jemput, catatan } = reservationData;
        const [result] = await db.query(
            `INSERT INTO reservasi (user_id, motor_id, tanggal_mulai, tanggal_selesai, lama_sewa, total_harga, lokasi_jemput, catatan, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, motor_id, tanggal_mulai, tanggal_selesai, lama_sewa, total_harga, lokasi_jemput, catatan || null, 'pending']
        );
        return result.insertId;
    }

    // Memperbarui checkMotorAvailability agar sesuai dengan kolom database yang baru
    static async checkMotorAvailability(motorId, tanggalMulai, tanggalSelesai) {
        const [rows] = await db.query(
            `SELECT COUNT(*) as count FROM reservasi
            WHERE motor_id = ?
            AND status IN ('pending', 'confirmed') -- Asumsi status ini berarti motor tidak tersedia
            AND (
                (tanggal_mulai <= ? AND tanggal_selesai >= ?) OR
                (tanggal_mulai >= ? AND tanggal_mulai <= ?) OR
                (tanggal_selesai >= ? AND tanggal_selesai <= ?)
            )`,
            [motorId, tanggalSelesai, tanggalMulai, tanggalMulai, tanggalSelesai, tanggalMulai, tanggalSelesai]
        );
        return rows[0].count === 0; // Mengembalikan true jika motor tersedia, false jika ada konflik
    }
}

module.exports = Reservation;