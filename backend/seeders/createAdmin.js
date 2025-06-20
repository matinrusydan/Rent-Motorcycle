// backend/seeders/createAdmin.js
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rental_motor',
    port: process.env.DB_PORT || 3306
};

async function createAdminUser() {
    let connection;
    
    try {
        // Create database connection
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database');

        // Admin user data
        const adminData = {
            nama_lengkap: 'Administrator',
            email: 'admin@rentalmotor.com',
            password: 'admin123', // Will be hashed
            no_hp: '081234567890',
            jenis_kelamin: 'laki-laki',
            dusun: 'Jl. Admin No. 1',
            rt: '001',
            rw: '001',
            desa: 'Desa Admin',
            kecamatan: 'Kecamatan Admin',
            kota: 'Kota Admin',
            provinsi: 'Provinsi Admin',
            role: 'admin',
            is_verified: 1
        };

        // Check if admin already exists
        const [existingAdmin] = await connection.execute(
            'SELECT email FROM users WHERE email = ? OR role = ?',
            [adminData.email, 'admin']
        );

        if (existingAdmin.length > 0) {
            console.log('Admin user already exists!');
            return;
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);

        // Insert admin user
        const query = `
            INSERT INTO users (
                nama_lengkap, email, password, no_hp, jenis_kelamin,
                dusun, rt, rw, desa, kecamatan, kota, provinsi,
                role, is_verified, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

        const values = [
            adminData.nama_lengkap,
            adminData.email,
            hashedPassword,
            adminData.no_hp,
            adminData.jenis_kelamin,
            adminData.dusun,
            adminData.rt,
            adminData.rw,
            adminData.desa,
            adminData.kecamatan,
            adminData.kota,
            adminData.provinsi,
            adminData.role,
            adminData.is_verified
        ];

        const [result] = await connection.execute(query, values);
        
        console.log('✅ Admin user created successfully!');
        console.log('📧 Email:', adminData.email);
        console.log('🔑 Password:', adminData.password);
        console.log('👤 Role:', adminData.role);
        console.log('🆔 User ID:', result.insertId);

    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the seeder
createAdminUser();