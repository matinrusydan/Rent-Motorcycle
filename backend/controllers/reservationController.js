// backend/controllers/reservationController.js

const Reservation = require('../models/Reservation');
const Motor = require('../models/Motor'); // Perlu untuk cek ketersediaan motor
const User = require('../models/User');   // Perlu untuk cek user
const db = require('../config/db');
// Mengambil semua reservasi (tidak berubah signifikan, hanya kolom)
const getAllReservations = async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();

        // Kueri untuk mendapatkan semua reservasi dengan detail user dan motor
        const [rows] = await connection.execute(
            `SELECT
                r.id,
                r.user_id,
                r.motor_id,
                r.tanggal_mulai,
                r.tanggal_selesai,
                r.lama_sewa,
                r.lokasi_jemput,
                r.total_harga,
                r.status,
                r.catatan,
                r.created_at,
                r.updated_at,
                u.nama_lengkap AS user_nama_lengkap,
                u.email AS user_email,
                u.no_hp AS user_no_hp, -- <<< KOLOM NO_HP DARI TABEL USERS
                m.brand AS motor_brand,
                m.type AS motor_type,
                m.price AS motor_price,
                m.gambar_motor AS motor_gambar
            FROM reservasi r
            JOIN users u ON r.user_id = u.id
            JOIN motors m ON r.motor_id = m.id
            ORDER BY r.created_at DESC`
        );

        // Map data agar sesuai dengan yang diharapkan frontend ReservasiAdmin.jsx
        const mappedReservations = rows.map(res => ({
            ...res,
            motor_name: `${res.motor_brand} ${res.motor_type}`, // Frontend menggunakan motor_name
            no_hp: res.user_no_hp, // Frontend menggunakan no_hp langsung
            nama_lengkap: res.user_nama_lengkap, // Frontend menggunakan nama_lengkap langsung
            tanggal_sewa: res.tanggal_mulai, // Frontend menggunakan tanggal_sewa
            lama_sewa_hari: res.lama_sewa // Frontend menggunakan lama_sewa_hari
        }));

        res.status(200).json({ success: true, data: mappedReservations });

    } catch (error) {
        console.error('Error in getAllReservations:', error); // Ini akan mencetak error ke terminal backend Anda
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat mengambil data reservasi.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};


// Memperbarui status reservasi (tidak berubah)
const updateReservationStatus = async (req, res) => {
    let connection;
    try {
        const { id } = req.params; // ID reservasi
        const { status } = req.body; // Status baru

        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        if (!status || !validStatuses.includes(status.toLowerCase())) {
            return res.status(400).json({ success: false, message: 'Status tidak valid.' });
        }

        connection = await db.getConnection();
        await connection.beginTransaction(); // Mulai transaksi

        const [reservationRows] = await connection.execute(
            'SELECT motor_id, status FROM reservasi WHERE id = ?',
            [id]
        );
        const reservation = reservationRows[0];

        if (!reservation) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Reservasi tidak ditemukan.' });
        }

        // Perbarui status reservasi di tabel `reservasi`
        await connection.execute(
            'UPDATE reservasi SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status.toLowerCase(), id]
        );

        // Logika untuk mengubah status motor di tabel `motors`
        let newMotorStatus = null;
        if (status.toLowerCase() === 'completed' || status.toLowerCase() === 'cancelled') {
            newMotorStatus = 'available'; // Motor kembali tersedia
        }
        // Jika status diubah dari pending ke confirmed, ini seharusnya sudah dihandle oleh paymentController
        // Jadi, kita hanya fokus pada 'completed' dan 'cancelled' di sini.

        if (newMotorStatus && reservation.motor_id) {
            await connection.execute(
                'UPDATE motors SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [newMotorStatus, reservation.motor_id]
            );
            console.log(`Motor ${reservation.motor_id} status diubah menjadi '${newMotorStatus}' karena reservasi ${id} ${status.toLowerCase()}.`);
        }

        await connection.commit(); // Komit transaksi
        res.status(200).json({ success: true, message: `Status reservasi ${id} berhasil diubah menjadi ${status}.` });

    } catch (error) {
        console.error('Error in updateReservationStatus:', error);
        if (connection) await connection.rollback();
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat mengubah status reservasi.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// Membuat reservasi baru
const createReservation = async (req, res) => {
    try {
        const { user_id, motor_id, tanggal_mulai, tanggal_selesai, lama_sewa, lokasi_jemput, catatan } = req.body;

        // Validasi input
        if (!user_id || !motor_id || !tanggal_mulai || !tanggal_selesai || !lama_sewa || !lokasi_jemput) {
            return res.status(400).json({ success: false, message: 'Semua field wajib diisi.' });
        }

        const lama_sewa_int = parseInt(lama_sewa);
        if (isNaN(lama_sewa_int) || lama_sewa_int <= 0) {
            return res.status(400).json({ success: false, message: 'Lama sewa harus berupa angka positif.' });
        }

        // Pastikan format tanggal sesuai untuk database
        const tgl_mulai = new Date(tanggal_mulai).toISOString().slice(0, 10);
        const tgl_selesai = new Date(tanggal_selesai).toISOString().slice(0, 10);

        // Cek user existence dan verifikasi
        const userExists = await User.findById(user_id);
        if (!userExists || !userExists.is_verified) {
            return res.status(400).json({ success: false, message: 'Pengguna tidak valid atau belum diverifikasi.' });
        }

        const motor = await Motor.getById(motor_id); // Gunakan getById
        if (!motor || motor.status !== 'available') {
            return res.status(400).json({ success: false, message: 'Motor tidak valid atau tidak tersedia untuk disewa.' });
        }

        // Cek ketersediaan motor untuk tanggal yang diminta
        const isMotorAvailable = await Reservation.checkMotorAvailability(motor_id, tgl_mulai, tgl_selesai);
        if (!isMotorAvailable) {
            return res.status(400).json({ success: false, message: 'Motor sudah dipesan pada rentang tanggal tersebut.' });
        }

        // --- PERBAIKAN DI SINI ---
        const total_harga = motor.price * lama_sewa_int; // Ganti motor.harga_sewa dengan motor.price
        // --- AKHIR PERBAIKAN ---

        // Tambahkan validasi untuk total_harga setelah dihitung
        if (isNaN(total_harga) || total_harga <= 0) {
            return res.status(400).json({ success: false, message: 'Total harga tidak dapat dihitung dengan benar.' });
        }

        const reservationId = await Reservation.create({
            user_id,
            motor_id,
            tanggal_mulai: tgl_mulai,
            tanggal_selesai: tgl_selesai,
            lama_sewa: lama_sewa_int,
            total_harga,
            lokasi_jemput,
            catatan
        });

        res.status(201).json({ success: true, message: 'Reservasi berhasil dibuat.', data: { id: reservationId } });

    } catch (error) {
        console.error('Error in createReservation:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: error.message });
    }
};



const getReservationById = async (req, res) => {
    let connection;
    try {
        const { id } = req.params; // ID reservasi dari parameter URL
        const userIdFromToken = req.user.id; // ID pengguna dari token JWT
        const userRoleFromToken = req.user.role; // Role pengguna dari token JWT

        connection = await db.getConnection(); 

        const [rows] = await connection.execute(
            // ... (kueri SQL Anda)
            `SELECT
                r.id,
                r.user_id,
                r.motor_id,
                r.tanggal_mulai,
                r.tanggal_selesai,
                r.lama_sewa,
                r.lokasi_jemput,
                r.total_harga,
                r.status,
                r.catatan,
                r.created_at,
                r.updated_at,
                u.nama_lengkap AS user_nama_lengkap,
                u.email AS user_email,
                m.brand AS motor_brand,
                m.type AS motor_type,
                m.price AS motor_price,
                m.gambar_motor AS motor_gambar
            FROM reservasi r
            JOIN users u ON r.user_id = u.id
            JOIN motors m ON r.motor_id = m.id
            WHERE r.id = ?`,
            [id]
        );

        const reservation = rows[0];

        // --- PERBAIKAN DI SINI ---
        // Log ini seharusnya hanya dijalankan JIKA reservasi ditemukan,
        // atau gunakan optional chaining untuk menghindari error.
        // Hapus blok log yang salah tempat ini:
        /*
        console.log(`Mengambil Reservasi ID: ${reservationId}`);
        console.log(`User ID dari Token: ${userIdFromToken} (Role: ${userRoleFromToken})`);
        console.log(`User ID dari Reservasi (ID ${reservationId}): ${reservation.user_id}`);
        */
        // --- AKHIR PERBAIKAN ---

        if (!reservation) {
            console.log(`DEBUG getReservationById: Reservasi ID ${id} tidak ditemukan (404).`);
            return res.status(404).json({ success: false, message: 'Reservasi tidak ditemukan.' });
        }
        
        // --- LOG DEBUGGING YANG BENAR DAN TERSTRUKTUR ---
        // Pindahkan log di bawah `if (!reservation)` agar `reservation` dipastikan ada
        console.log('--- DEBUG Otorisasi Reservasi ---');
        console.log(`Mengambil Reservasi ID: ${id}`); // Gunakan `id` dari req.params
        console.log(`User ID dari Token (req.user.id): ${userIdFromToken} (Role: ${userRoleFromToken})`);
        console.log(`User ID dari Reservasi (dari DB - reservation.user_id): ${reservation.user_id}`);
        console.log('---------------------------------');
        // --- AKHIR LOG DEBUGGING ---

        // Logika otorisasi utama
        // Pastikan pengguna dengan peran 'user' hanya bisa melihat reservasi miliknya
        if (userRoleFromToken === 'user' && reservation.user_id !== userIdFromToken) {
            console.log(`DEBUG getReservationById: User ID tidak cocok. Reservasi dimiliki oleh ${reservation.user_id}, tetapi token user ID ${userIdFromToken}. Mengembalikan 403.`);
            return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses ke reservasi ini.' });
        }
        // Hapus duplikasi kondisi otorisasi ini:
        /*
        if (req.user.role === 'user' && reservation.user_id !== userIdFromToken) {
            return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses ke reservasi ini.' });
        }
        */

        // Jika lolos semua pemeriksaan, kirim detail reservasi
        console.log('DEBUG getReservationById: Otorisasi berhasil. Mengirim data reservasi.');
        res.status(200).json({ success: true, data: reservation });

    } catch (error) {
        console.error('Error in getReservationById:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat mengambil detail reservasi.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    getAllReservations,
    updateReservationStatus,
    createReservation,
    getReservationById
};