// backend/models/User.js
const db = require('../config/db');

class User {
    static async findByEmail(email) {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0];
    }

    static async create(userData) {
        const { nama_lengkap, email, password, no_hp, jenis_kelamin, dusun, rt, rw, desa, kecamatan, kota, provinsi, foto_ktp, role, is_verified } = userData;
        const [result] = await db.query(
            'INSERT INTO users (nama_lengkap, email, password, no_hp, jenis_kelamin, dusun, rt, rw, desa, kecamatan, kota, provinsi, foto_ktp, role, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [nama_lengkap, email, password, no_hp, jenis_kelamin, dusun, rt, rw, desa, kecamatan, kota, provinsi, foto_ktp, role || 'user', is_verified || false]
        );
        return result.insertId;
    }

    static async updateVerificationStatus(userId, is_verified) {
        await db.query('UPDATE users SET is_verified = ? WHERE id = ?', [is_verified, userId]);
    }
}

module.exports = User;