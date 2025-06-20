// backend/controllers/reservationController.js
const Reservation = require('../models/Reservation');
const Motor = require('../models/Motor'); // Perlu untuk cek ketersediaan motor
const User = require('../models/User');   // Perlu untuk cek user

// Mengambil semua reservasi
const getAllReservations = async (req, res) => {
    try {
        const filters = {
            search: req.query.search,
            status: req.query.status
        };
        const reservations = await Reservation.findAll(filters);
        // Map data untuk menggabungkan motor_brand dan motor_type menjadi motor_name
        const mappedReservations = reservations.map(res => ({
            ...res,
            motor_name: `${res.motor_brand} ${res.motor_type}` // Buat field motor_name untuk frontend
        }));
        res.json({ success: true, data: mappedReservations });
    } catch (error) {
        console.error('Error in getAllReservations:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data reservasi.', error: error.message });
    }
};

// Memperbarui status reservasi
const updateReservationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // Status baru: 'confirmed', 'completed', 'cancelled'

        if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Status reservasi tidak valid.' });
        }

        const updated = await Reservation.updateStatus(id, status);
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Reservasi tidak ditemukan.' });
        }
        res.json({ success: true, message: `Status reservasi berhasil diubah menjadi ${status}.` });
    } catch (error) {
        console.error('Error in updateReservationStatus:', error);
        res.status(500).json({ success: false, message: 'Gagal mengubah status reservasi.', error: error.message });
    }
};

// Fungsi baru: Membuat reservasi baru (dari user publik/login)
const createReservation = async (req, res) => {
    let connection; // Deklarasikan connection di luar try untuk finally block
    try {
        const { user_id, motor_id, tanggal_sewa, lama_sewa_hari, catatan } = req.body;

        if (!user_id || !motor_id || !tanggal_sewa || !lama_sewa_hari) {
            return res.status(400).json({ success: false, message: 'User ID, Motor ID, tanggal sewa, dan lama sewa wajib diisi.' });
        }

        // Validasi user_id dan motor_id eksis dan motor tersedia
        const userExists = await User.findById(user_id);
        if (!userExists || !userExists.is_verified) {
            return res.status(400).json({ success: false, message: 'Pengguna tidak valid atau belum diverifikasi.' });
        }
        
        const motor = await Motor.findById(motor_id);
        if (!motor || motor.status !== 'available') {
            return res.status(400).json({ success: false, message: 'Motor tidak valid atau tidak tersedia untuk disewa.' });
        }

        const total_harga = motor.harga_sewa * lama_sewa_hari; // Hitung total harga

        const reservationId = await Reservation.create({
            user_id, motor_id, tanggal_sewa, lama_sewa_hari, total_harga, catatan
        });

        // Opsional: Perbarui status motor menjadi 'rented' atau 'pending' setelah reservasi dibuat
        // Ini tergantung alur bisnis: apakah motor langsung disewa setelah reservasi atau menunggu pembayaran
        // await Motor.updateStatus(motor_id, 'rented'); // Jika motor langsung ditandai disewa

        res.status(201).json({ success: true, message: 'Reservasi berhasil dibuat.', reservationId: reservationId });

    } catch (error) {
        console.error('Error in createReservation:', error);
        res.status(500).json({ success: false, message: 'Gagal membuat reservasi.', error: error.message });
    }
};


module.exports = {
    getAllReservations,
    updateReservationStatus,
    createReservation // ✅ Ekspor fungsi baru ini
};