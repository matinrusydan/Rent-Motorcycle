// backend/server-debug.js
require('dotenv').config(); 
const express = require('express');
const cors = require('cors'); 
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(cors()); 
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' })); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 

// Basic route
app.get('/', (req, res) => {
    res.json({
        message: 'Debug server is running!',
        version: '1.0.0'
    });
});

// Test route loading step by step
console.log('Loading auth routes...');
try {
    const authRoutes = require('./routes/authRoutes');
    app.use('/api/auth', authRoutes);
    console.log('✓ Auth routes loaded successfully');
} catch (error) {
    console.error('✗ Error loading auth routes:', error.message);
}

console.log('Loading motor routes...');
try {
    const motorRoutes = require('./routes/motorRoutes');
    app.use('/api/admin/motors', motorRoutes);
    console.log('✓ Motor routes loaded successfully');
} catch (error) {
    console.error('✗ Error loading motor routes:', error.message);
    console.error('Full error:', error);
}

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Debug server running on port ${PORT}`);
    console.log(`Access: http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down...');
    process.exit(0);
});