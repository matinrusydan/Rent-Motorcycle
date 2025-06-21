// backend/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const path = require('path');
const multer = require('multer'); // Pastikan multer diimpor untuk middleware error

// --- IMPOR ROUTES ---
const authRoutes = require('./routes/authRoutes');
const motorRoutes = require('./routes/motorRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const publicRoutes = require('./routes/publicRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes')
const dashboardRoutes = require('./routes/dashboardRoutes'); 


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware Global
app.use(cors()); // PINDAHKAN BARIS INI KE SINI

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Menyajikan file statis dari folder 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rute sederhana untuk menguji server
app.get('/', (req, res) => {
    res.json({
        message: 'API Rental Motor is Running!',
        version: '1.0.0',
        endpoints: {
            public: '/api',
            auth: '/api/auth',
            motors_admin: '/api/admin/motors',
            reservations_admin: '/api/admin/reservations'
        }
    });
});

// --- DAFTAR ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/admin/motors', motorRoutes); 
app.use('/api/admin/reservations', reservationRoutes); 
app.use('/api', publicRoutes); 
app.use('/api/user', userRoutes); 
app.use('/api/payments', paymentRoutes);
app.use('/api/admin/testimonials', testimonialRoutes);
app.use('/api/admin/dashboard', dashboardRoutes); 
app.use('/api', publicRoutes);

// Middleware
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error('Multer error:', err.code, err.message);
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: 'Ukuran file terlalu besar. Maksimal 5MB.' });
        }
    } else if (err) {
        console.error('Unknown upload error:', err);
    }

    if (err.message === 'Only image files are allowed!' || (err.message && err.message.includes('file format'))) {
        return res.status(400).json({ success: false, message: 'Hanya file gambar (JPEG, JPG, PNG) atau PDF yang diizinkan!' });
    }

    // Penanganan error umum
    res.status(err.status || 500).json({ success: false, message: err.message || 'Terjadi kesalahan server internal.' });
});

// Handle 404 routes (INI HARUS PALING AKHIR SETELAH SEMUA ROUTE API ANDA DIDAFATARKAN)
app.use('/', (req, res) => { // Menggunakan '*' atau '/' untuk menangani semua rute yang tidak cocok
    res.status(404).json({ success: false, message: `Rute ${req.originalUrl} tidak ditemukan.` });
});
// Start server
app.listen(PORT, () => {
    console.log(`Express server berjalan di port ${PORT}`);
    console.log(`Akses: http://localhost:${PORT}`);
    console.log(`API Dokumentasi:`);
    console.log(`  - Public API: http://localhost:${PORT}/api`);
    console.log(`  - Auth API: http://localhost:${PORT}/api/auth`);
    console.log(`  - Motors Admin API: http://localhost:${PORT}/api/admin/motors`);
    console.log(`  - Reservations Admin API: http://localhost:${PORT}/api/admin/reservations`);
});