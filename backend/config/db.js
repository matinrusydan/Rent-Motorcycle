// backend/config/db.js
const mysql = require('mysql2/promise'); // Menggunakan versi promise dari mysql2
require('dotenv').config(); // Memuat variabel lingkungan dari .env

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', // Kosongkan jika tidak ada password
    database: process.env.DB_NAME || 'rental_motor_db', // Nama database yang akan Anda buat
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Uji koneksi database
db.getConnection()
  .then(connection => {
    console.log('Terhubung ke database MySQL!');
    connection.release(); // Lepaskan koneksi setelah pengujian
  })
  .catch(err => {
    console.error('Gagal terhubung ke database MySQL:', err);
    process.exit(1); // Keluar dari aplikasi jika gagal terhubung ke DB
  });

module.exports = db;