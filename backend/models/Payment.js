// backend/models/Payment.js
const db = require('../config/db');

class Payment {
    static async create(paymentData) {
        const { reservasi_id, jumlah_pembayaran, metode_pembayaran, bukti_transfer, catatan_pembeli } = paymentData;
        let connection;
        try {
            connection = await db.getConnection();
            const [result] = await connection.execute(
                `INSERT INTO pembayaran 
                (reservasi_id, jumlah_pembayaran, metode_pembayaran, bukti_transfer, catatan_pembeli) 
                VALUES (?, ?, ?, ?, ?)`,
                [reservasi_id, jumlah_pembayaran, metode_pembayaran, bukti_transfer, catatan_pembeli]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error creating payment:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    static async findById(id) {
        let connection;
        try {
            connection = await db.getConnection();
            const [rows] = await connection.execute(
                'SELECT * FROM pembayaran WHERE id = ?',
                [id]
            );
            return rows[0];
        } catch (error) {
            console.error('Error finding payment by ID:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    static async findByReservationId(reservasi_id) {
        let connection;
        try {
            connection = await db.getConnection();
            const [rows] = await connection.execute(
                'SELECT * FROM pembayaran WHERE reservasi_id = ?',
                [reservasi_id]
            );
            return rows[0];
        } catch (error) {
            console.error('Error finding payment by reservation ID:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    static async updateStatus(id, status, adminNotes = null) {
        let connection;
        try {
            connection = await db.getConnection();
            const [result] = await connection.execute(
                'UPDATE pembayaran SET status_pembayaran = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [status, adminNotes, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating payment status:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    // Fungsi untuk mendapatkan semua pembayaran (opsional, mungkin hanya untuk admin)
    static async findAll(filters = {}) {
        let query = `
            SELECT 
                p.id, 
                p.reservasi_id, 
                p.jumlah_pembayaran, 
                p.tanggal_pembayaran, 
                p.metode_pembayaran, 
                p.bukti_transfer, 
                p.catatan_pembeli, 
                p.status_pembayaran, 
                p.admin_notes, 
                p.created_at, 
                p.updated_at,
                r.total_harga AS reservasi_total_harga,
                r.tanggal_mulai AS reservasi_tanggal_mulai,
                r.tanggal_selesai AS reservasi_tanggal_selesai,
                r.lokasi_jemput AS reservasi_lokasi_jemput,
                u.nama_lengkap AS user_nama_lengkap,
                u.email AS user_email,
                m.brand AS motor_brand,
                m.type AS motor_type
            FROM pembayaran p
            JOIN reservasi r ON p.reservasi_id = r.id
            JOIN users u ON r.user_id = u.id
            JOIN motors m ON r.motor_id = m.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.status) {
            query += ' AND p.status_pembayaran = ?';
            params.push(filters.status);
        }
        if (filters.search) {
            query += ' AND (u.nama_lengkap LIKE ? OR m.brand LIKE ? OR m.type LIKE ? OR p.reservasi_id LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
        }

        query += ' ORDER BY p.created_at DESC';

        let connection;
        try {
            connection = await db.getConnection();
            const [rows] = await connection.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Error in Payment.findAll:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }
}

module.exports = Payment;