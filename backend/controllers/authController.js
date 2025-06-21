// backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); 
const User = require('../models/User'); 
const PendingUser = require('../models/PendingUser'); 
const fs = require('fs'); 
const path = require('path'); 
// const User = require('../models/User');



// Fungsi untuk Registrasi User
const register = async (req, res) => {
    try {
        const { email, password, nama_lengkap, no_hp, jenis_kelamin, dusun, rt, rw, desa, kecamatan, kota, provinsi } = req.body;
        // Tidak perlu lagi .replace(/\\/g, '/'); karena multerMiddleware yang baru sudah mengaturnya.
        // req.file.path sudah seharusnya berisi path relatif seperti 'uploads/ktp/namafile.png'
        const foto_ktp_path = req.file ? req.file.path : null; // <<< Gunakan req.file.path langsung

        if (!email || !password || !nama_lengkap || !no_hp || !jenis_kelamin ||
            !dusun || !rt || !rw || !desa || !kecamatan || !kota || !provinsi) {
            // Jika ada file dan error validasi, hapus file yang sudah terupload
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, message: 'Semua field harus diisi.' });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Foto KTP harus diupload.' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, message: 'Format email tidak valid.' });
        }
        if (password.length < 6) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, message: 'Password minimal 6 karakter.' });
        }
        const phoneRegex = /^[0-9]{10,13}$/;
        const cleanPhone = String(no_hp).replace(/[^0-9]/g, '');
        if (!phoneRegex.test(cleanPhone)) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, message: 'Nomor HP tidak valid.' });
        }

        const existingUser = await User.findByEmail(email);
        const existingPendingUser = await PendingUser.findByEmail(email);

        if (existingUser || existingPendingUser) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, message: 'Email sudah terdaftar atau sedang dalam proses verifikasi.' });
        }

        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const pendingUserId = await PendingUser.create({
            nama_lengkap, email, password: hashedPassword, no_hp: cleanPhone, jenis_kelamin,
            dusun, rt, rw, desa, kecamatan, kota, provinsi,
            foto_ktp: foto_ktp_path // Ini akan menyimpan path relatif
        });

        console.log(`New user registration pending: ${email} - ID: ${pendingUserId}`);

        res.status(201).json({
            success: true, message: 'Registrasi berhasil. Akun Anda akan segera diverifikasi oleh admin.',
            data: { id: pendingUserId, email: email, nama_lengkap: nama_lengkap, status: 'pending' }
        });

    } catch (error) {
        console.error('Registration error:', error);
        // Pastikan error handling ini juga menghapus file dengan path yang benar
        if (req.file) { // Hanya jika ada file yang diupload
            // Gunakan path asli yang disimpan Multer di disk untuk penghapusan
            // atau path yang sudah dimodifikasi jika fs.unlinkSync bisa menanganinya
            // Paling aman: hapus file menggunakan path lengkap dari Multer sebelum dimodifikasi
            // Namun, karena Multer sudah memodifikasi req.file.path, kita bisa coba ini
            // Jika ada masalah, kita perlu simpan path sementara sebelum dimodifikasi
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
        }
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Email sudah terdaftar.' });
        }
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: error.message });
    }
};
// Fungsi untuk Login User
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Email atau password salah.' });
        }

        if (!user.is_verified) {
            return res.status(403).json({ message: 'Akun Anda belum diverifikasi oleh admin.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Email atau password salah.' });
        }

        const token = jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        process.env.JWT_SECRET,         // ✅ ← ini pakai secret yang kamu tunjukkan
        { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Login berhasil.',
            token,
            user: {
                id: user.id,
                nama_lengkap: user.nama_lengkap,
                email: user.email,
                role: user.role,
                is_verified: user.is_verified
            }
        });

    } catch (error) {
        console.error('Error saat login:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server.', error: error.message });
    }
};


const updateAdminProfile = async (req, res) => {
    let connection;
    try {
        const adminId = req.user.id; // ID admin dari token JWT
        const adminRole = req.user.role; // Role admin dari token JWT
        const { currentEmail, newEmail, currentPassword, newPassword } = req.body;

        // Pastikan yang mengakses adalah admin
        if (adminRole !== 'admin') {
            return res.status(403).json({ success: false, message: 'Akses ditolak. Hanya admin yang bisa mengubah pengaturan ini.' });
        }

        connection = await db.getConnection();
        await connection.beginTransaction(); // Mulai transaksi

        const [adminRows] = await connection.execute('SELECT id, email, password FROM users WHERE id = ? AND role = "admin"', [adminId]);
        const admin = adminRows[0];

        if (!admin) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Admin tidak ditemukan.' });
        }

        // --- Verifikasi Email Saat Ini ---
        if (admin.email !== currentEmail) {
            await connection.rollback();
            return res.status(401).json({ success: false, message: 'Email saat ini salah.' });
        }

        // --- Verifikasi Password Saat Ini (jika ada newPassword) ---
        let hashedPassword = admin.password; // Default: gunakan password lama
        if (newPassword) {
            if (!currentPassword) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: 'Password saat ini wajib diisi untuk mengubah password.' });
            }
            const isMatch = await bcrypt.compare(currentPassword, admin.password);
            if (!isMatch) {
                await connection.rollback();
                return res.status(401).json({ success: false, message: 'Password saat ini salah.' });
            }
            if (newPassword.length < 6) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter.' });
            }
            hashedPassword = await bcrypt.hash(newPassword, 12); // Hash password baru
        }


        // --- Perbarui Email (jika ada perubahan) ---
        if (newEmail && newEmail !== currentEmail) {
            // Cek apakah email baru sudah terdaftar
            const [existingUser] = await connection.execute('SELECT id FROM users WHERE email = ? AND id != ?', [newEmail, adminId]);
            if (existingUser.length > 0) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: 'Email baru sudah terdaftar oleh pengguna lain.' });
            }
        } else {
            newEmail = currentEmail; // Gunakan email yang ada jika tidak ada perubahan email baru
        }


        // --- Lakukan Update ke Database ---
        await connection.execute(
            'UPDATE users SET email = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newEmail, hashedPassword, adminId]
        );

        await connection.commit(); // Komit transaksi

        // Berikan token baru jika email berubah
        if (newEmail !== currentEmail) {
            const newToken = jwt.sign(
                { id: admin.id, role: admin.role, email: newEmail },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
            return res.status(200).json({ success: true, message: 'Pengaturan admin berhasil diperbarui. Silakan login ulang.', newToken: newToken });
        }
        
        res.status(200).json({ success: true, message: 'Pengaturan admin berhasil diperbarui.' });

    } catch (error) {
        console.error('Error updating admin profile:', error);
        if (connection) await connection.rollback();
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat memperbarui pengaturan admin.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// Fungsi untuk Memeriksa Ketersediaan Email
// Fungsi untuk Memeriksa Ketersediaan Email
const checkEmailAvailability = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email harus diisi.' });
        }

        const existingUser = await User.findByEmail(email);
        const existingPendingUser = await PendingUser.findByEmail(email);

        const available = !(existingUser || existingPendingUser);

        // PERBAIKAN: Kembalikan status yang benar
        if (available) {
            res.status(200).json({ available: true, message: 'Email tersedia.' });
        } else {
            res.status(200).json({ available: false, message: 'Email sudah terdaftar atau sedang dalam proses verifikasi.' });
        }
    } catch (error) {
        console.error('Error checking email:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: error.message });
    }
};

// Fungsi untuk Mendapatkan Profil User yang Sudah Login
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User tidak ditemukan.' });
        }
        res.status(200).json({
            id: user.id, nama_lengkap: user.nama_lengkap, email: user.email,
            no_hp: user.no_hp, role: user.role, is_verified: user.is_verified
        });
    } catch (error) {
        console.error('Error saat mengambil profil:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server.', error: error.message });
    }
};


// Fungsi baru: Mendapatkan semua pending users (untuk admin)
const getPendingUsers = async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection(); 
        const [rows] = await connection.execute(
            'SELECT id, nama_lengkap, email, no_hp, jenis_kelamin, dusun, rt, rw, desa, kecamatan, kota, provinsi, foto_ktp, created_at FROM pending_users ORDER BY created_at DESC'
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching pending users:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: error.message });
    } finally {
        if (connection) connection.release(); 
    }
};

// Fungsi baru: Menyetujui user dari pending (untuk admin)
const approveUser = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        
        connection = await db.getConnection(); 
        await connection.beginTransaction();

        const [pendingUserRows] = await connection.execute(
            'SELECT * FROM pending_users WHERE id = ?',
            [id]
        );

        if (pendingUserRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'User pending tidak ditemukan.' });
        }
        const user = pendingUserRows[0];

        await connection.execute(
            `INSERT INTO users 
            (nama_lengkap, email, password, no_hp, jenis_kelamin, dusun, rt, rw, desa, kecamatan, kota, provinsi, foto_ktp, role, is_verified, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                user.nama_lengkap, user.email, user.password, user.no_hp, user.jenis_kelamin,
                user.dusun, user.rt, user.rw, user.desa, user.kecamatan, user.kota, user.provinsi,
                user.foto_ktp, 'user', true, user.created_at
            ]
        );

        await connection.execute(
            'DELETE FROM pending_users WHERE id = ?',
            [id]
        );

        await connection.commit();
        console.log(`User approved: ${user.email} - ID: ${id}`);
        res.json({ success: true, message: 'User berhasil disetujui dan dipindahkan.' });

    } catch (error) {
        console.error('Error approving user:', error);
        if (connection) await connection.rollback();
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: error.message });
    } finally {
        if (connection) connection.release(); 
    }
};

// Fungsi baru: Menolak user dari pending (untuk admin)
const rejectUser = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;

        connection = await db.getConnection(); 

        const [pendingUserRows] = await connection.execute(
            'SELECT * FROM pending_users WHERE id = ?',
            [id]
        );

        if (pendingUserRows.length === 0) {
            return res.status(404).json({ success: false, message: 'User pending tidak ditemukan.' });
        }
        const user = pendingUserRows[0];

        const uploadsBasePath = path.join(__dirname, '../uploads/ktp'); 
        const ktpFileName = path.basename(user.foto_ktp);
        const ktpFilePath = path.join(uploadsBasePath, ktpFileName);

        if (fs.existsSync(ktpFilePath)) {
            fs.unlinkSync(ktpFilePath);
            console.log(`File KTP dihapus: ${ktpFilePath}`);
        } else {
            console.warn(`File KTP tidak ditemukan saat penghapusan: ${ktpFilePath}`);
        }

        await connection.execute(
            'DELETE FROM pending_users WHERE id = ?',
            [id]
        );

        console.log(`User rejected: ${user.email} - ID: ${id}`);
        res.json({ success: true, message: 'User berhasil ditolak dan dihapus.' });

    } catch (error) {
        console.error('Error rejecting user:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: error.message });
    } finally {
        if (connection) connection.release(); 
    }
};

// Fungsi baru: Mengambil semua pengguna dari tabel 'users' (untuk admin)
const getAllUsers = async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection(); 
        const [rows] = await connection.execute(
            'SELECT id, nama_lengkap, email, no_hp, role, is_verified, created_at FROM users ORDER BY created_at DESC'
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: error.message });
    } finally {
        if (connection) connection.release(); 
    }
};


module.exports = { 
    register, 
    login, 
    getProfile, 
    checkEmailAvailability, 
    getPendingUsers, 
    approveUser,     
    rejectUser,    
    getAllUsers,
    updateAdminProfile
};