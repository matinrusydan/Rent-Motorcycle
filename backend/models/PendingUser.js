// backend/models/PendingUser.js
const db = require('../config/db');

class PendingUser {
    static async create(userData) {
        const { nama_lengkap, email, password, no_hp, jenis_kelamin, dusun, rt, rw, desa, kecamatan, kota, provinsi, foto_ktp } = userData;
        const [result] = await db.query(
            'INSERT INTO pending_users (nama_lengkap, email, password, no_hp, jenis_kelamin, dusun, rt, rw, desa, kecamatan, kota, provinsi, foto_ktp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [nama_lengkap, email, password, no_hp, jenis_kelamin, dusun, rt, rw, desa, kecamatan, kota, provinsi, foto_ktp]
        );
        return result.insertId;
    }

    static async findByEmail(email) {
        const [rows] = await db.query('SELECT * FROM pending_users WHERE email = ?', [email]);
        return rows[0];
    }

    static async delete(id) {
        await db.query('DELETE FROM pending_users WHERE id = ?', [id]);
    }

    static async getAll() {
        const [rows] = await db.query('SELECT * FROM pending_users');
        return rows;
    }
}

module.exports = PendingUser;