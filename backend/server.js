// backend/server.js (Update file ini)
require('dotenv').config(); 
const express = require('express');
const cors = require('cors'); 
const db = require('./config/db'); 
const path = require('path'); 

// --- IMPOR ROUTES ---
const authRoutes = require('./routes/authRoutes'); 
const motorRoutes = require('./routes/motorRoutes'); 
const reservationRoutes = require('./routes/reservationRoutes'); 
const publicRoutes = require('./routes/publicRoutes'); // ✅ Impor rute publik

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware Global
app.use(cors()); 
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
            public: '/api', // Dokumentasi untuk rute publik
            auth: '/api/auth',
            motors_admin: '/api/admin/motors', // Perbarui dokumentasi
            reservations_admin: '/api/admin/reservations' // Perbarui dokumentasi
        }
    });
});

// Contoh rute untuk menguji koneksi database
app.get('/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS solution');
        res.json({ 
            message: 'Database connection successful!', 
            solution: rows[0].solution,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error testing DB:', error);
        res.status(500).json({ 
            message: 'Database connection failed!', 
            error: error.message 
        });
    }
});

// --- PENGGUNAAN ROUTES ---
app.use('/api/auth', authRoutes); 
app.use('/api/admin/motors', motorRoutes); 
app.use('/api/admin/reservations', reservationRoutes); 
// ✅ Gunakan rute publik di bawah prefix /api
app.use('/api', publicRoutes); 


// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler caught:', err);
    
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Ukuran file terlalu besar. Maksimal 5MB.' });
    }
    if (err.message === 'Only image files are allowed!' || err.message.includes('file format')) {
        return res.status(400).json({ success: false, message: 'Hanya file gambar (JPEG, JPG, PNG) atau PDF yang diizinkan!' });
    }

    res.status(err.status || 500).json({ success: false, message: err.message || 'Terjadi kesalahan server internal.' });
});

// Handle 404 routes
app.use('/', (req, res) => {
    res.status(404).json({ success: false, message: `Rute ${req.originalUrl} tidak ditemukan.` });
});

// Start server
app.listen(PORT, () => {
    console.log(`Express server berjalan di port ${PORT}`);
    console.log(`Akses: http://localhost:${PORT}`);
    console.log(`API Dokumentasi:`);
    console.log(`  - Public API: http://localhost:${PORT}/api`); // Dokumentasi baru
    console.log(`  - Auth API: http://localhost:${PORT}/api/auth`);
    console.log(`  - Motors Admin API: http://localhost:${PORT}/api/admin/motors`);
    console.log(`  - Reservations Admin API: http://localhost:${PORT}/api/admin/reservations`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM diterima, mematikan server...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT diterima, mematikan server...');
    process.exit(0);
});