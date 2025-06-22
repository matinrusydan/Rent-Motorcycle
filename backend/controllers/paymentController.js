// backend/controllers/paymentController.js
const Payment = require('../models/Payment');
const Reservation = require('../models/Reservation'); // Pastikan ini diimpor karena digunakan oleh Reservation.updateStatus
const fs = require('fs').promises; // Diperlukan untuk operasi file seperti fs.unlink dan fs.access
const path = require('path');
const db = require('../config/db');

// Fungsi untuk menangani persetujuan pembayaran oleh admin
const handlePaymentApproval = async (req, res) => {
    let connection;
    try {
        const { paymentId, newPaymentStatus, reservationId } = req.body;

        connection = await db.getConnection();
        await connection.beginTransaction(); // Mulai transaksi untuk atomicity

        // 1. Perbarui status pembayaran di tabel 'pembayaran'
        await connection.execute(
            'UPDATE pembayaran SET status_pembayaran = ?, updated_at = NOW() WHERE id = ?',
            [newPaymentStatus, paymentId]
        );

        // 2. Jika pembayaran disetujui, perbarui status reservasi dan motor
        let newReservationStatus = null;
        let newMotorStatus = null;

        if (newPaymentStatus === 'verified' || newPaymentStatus === 'approved') {
            newReservationStatus = 'confirmed';
            newMotorStatus = 'rented'; // Motor menjadi 'rented' jika pembayaran diverifikasi
        } else if (newPaymentStatus === 'rejected') {
            newReservationStatus = 'cancelled'; // Jika pembayaran ditolak, batalkan reservasi
            newMotorStatus = 'available'; // Motor kembali tersedia jika dibatalkan
        }

        // Perbarui status reservasi
        if (newReservationStatus) {
            await connection.execute(
                'UPDATE reservasi SET status = ?, updated_at = NOW() WHERE id = ?',
                [newReservationStatus, reservationId]
            );
            console.log(`Reservasi ${reservationId} status diubah menjadi '${newReservationStatus}' karena pembayaran ${newPaymentStatus}.`);

            // Perbarui status motor terkait jika diperlukan
            if (newMotorStatus) {
                const [reservationDetails] = await connection.execute(
                    'SELECT motor_id FROM reservasi WHERE id = ?',
                    [reservationId]
                );
                const motorId = reservationDetails[0]?.motor_id;
                if (motorId) {
                    await connection.execute(
                        'UPDATE motors SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                        [newMotorStatus, motorId]
                    );
                    console.log(`Motor ${motorId} status diubah menjadi '${newMotorStatus}' karena reservasi ${reservationId} ${newReservationStatus}.`);
                }
            }
        }

        await connection.commit(); // Komit transaksi
        res.status(200).json({ success: true, message: `Status pembayaran diperbarui menjadi ${newPaymentStatus}.` });

    } catch (error) {
        console.error('Error in handlePaymentApproval (admin):', error);
        if (connection) await connection.rollback(); // Rollback jika ada error
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat memperbarui status pembayaran.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// Fungsi untuk mengunggah bukti pembayaran oleh pengguna
const uploadPaymentProof = async (req, res) => {
    let connection; // Deklarasikan connection di sini untuk finally block
    try {
        const { reservasi_id, catatanTambahan } = req.body;
        // Pastikan path menggunakan forward slash untuk konsistensi di URL
        const bukti_transfer_path = req.file ? req.file.path.replace(/\\/g, '/') : null;

        // Validasi dasar
        if (!reservasi_id || !bukti_transfer_path) {
            // Hapus file yang sudah diunggah jika validasi gagal
            if (req.file && await fs.access(req.file.path).then(() => true).catch(() => false)) {
                await fs.unlink(req.file.path);
            }
            return res.status(400).json({ success: false, message: 'ID Reservasi dan Bukti Transfer wajib diisi.' });
        }

        // --- PENTING: Pindahkan pengambilan `reservation` ke sini, di luar if/else ---
        // Ini memastikan `reservation` selalu didefinisikan sebelum digunakan
        const reservation = await Reservation.findById(reservasi_id);
        console.log('DEBUG: reservasi_id yang diterima:', reservasi_id);
        console.log('DEBUG: Hasil Reservation.findById:', reservation); 

        if (!reservation) {
            // Hapus file yang sudah diunggah jika reservasi tidak ditemukan
            if (req.file && await fs.access(req.file.path).then(() => true).catch(() => false)) {
                await fs.unlink(req.file.path);
            }
            return res.status(404).json({ success: false, message: 'Reservasi tidak ditemukan untuk ID ini.' });
        }

        // Cek apakah sudah ada pembayaran untuk reservasi ini
        const existingPayment = await Payment.findByReservationId(reservasi_id);

        if (existingPayment) {
            // Jika ada pembayaran sebelumnya, hapus bukti transfer lama jika ada file baru
            if (req.file && existingPayment.bukti_transfer) {
                const oldImagePath = path.join(__dirname, '..', existingPayment.bukti_transfer);
                try {
                    // Cek apakah file lama benar-benar ada sebelum mencoba menghapusnya
                    if (await fs.access(oldImagePath).then(() => true).catch(() => false)) {
                        await fs.unlink(oldImagePath);
                        console.log('Old payment proof deleted:', oldImagePath);
                    }
                } catch (unlinkError) {
                    console.warn('Could not delete old payment proof (might not exist):', oldImagePath, unlinkError.message);
                }
            }

            connection = await db.getConnection();
            await connection.beginTransaction(); // Mulai transaksi

            // Perbarui pembayaran yang sudah ada
            await connection.execute(
                'UPDATE pembayaran SET bukti_transfer = ?, catatan_pembeli = ?, status_pembayaran = "pending", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [bukti_transfer_path, catatanTambahan, existingPayment.id]
            );

            // Perbarui status reservasi menjadi 'pending' karena bukti diunggah ulang
            await connection.execute(
                 'UPDATE reservasi SET status = ?, updated_at = NOW() WHERE id = ?',
                 ['pending', reservasi_id]
            );

            await connection.commit(); // Komit transaksi
            res.status(200).json({ success: true, message: 'Bukti pembayaran berhasil diperbarui.', payment_id: existingPayment.id });

        } else {
            // Jika belum ada pembayaran, buat pembayaran baru
            console.log('DEBUG: Membuat pembayaran baru untuk reservasi ID:', reservasi_id);
            console.log('DEBUG: jumlah_pembayaran dari reservation.total_harga:', reservation.total_harga);

            const paymentId = await Payment.create({
                reservasi_id,
                jumlah_pembayaran: reservation.total_harga, // Gunakan `reservation.total_harga` yang sudah diambil
                metode_pembayaran: 'transfer bank',
                bukti_transfer: bukti_transfer_path,
                catatan_pembeli: catatanTambahan
            });

            // Set status reservasi menjadi 'pending'
            await Reservation.updateStatus(reservasi_id, 'pending');

            res.status(201).json({ success: true, message: 'Bukti pembayaran berhasil diunggah.', payment_id: paymentId });
        }

    } catch (error) {
        console.error('Error uploading payment proof:', error);
        // Hapus file yang diunggah jika terjadi error saat pemrosesan
        if (req.file && await fs.access(req.file.path).then(() => true).catch(() => false)) {
            await fs.unlink(req.file.path);
        }
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat mengunggah bukti pembayaran.', error: error.message });
    } finally {
        if (connection) connection.release(); // Pastikan connection dilepaskan
    }
};

// Fungsi untuk mendapatkan semua pembayaran (untuk admin)
const getAllPayments = async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const filters = {
            status: req.query.status,
            search: req.query.search
        };

        // Modifikasi kueri untuk melakukan JOIN dengan reservasi, user, dan motor
        let query = `
            SELECT
                p.id,
                p.reservasi_id,
                p.jumlah_pembayaran,
                p.tanggal_pembayaran,
                p.metode_pembayaran,
                p.bukti_transfer,
                p.catatan_pembeli,
                p.status_pembayaran,
                p.admin_notes,
                p.created_at AS payment_created_at,
                r.tanggal_mulai AS reservasi_tanggal_mulai,
                r.tanggal_selesai AS reservasi_tanggal_selesai,
                r.lama_sewa AS reservasi_lama_sewa, -- Mengambil lama_sewa dari reservasi
                r.total_harga AS reservasi_total_harga,
                u.nama_lengkap AS user_nama_lengkap,
                u.email AS user_email,
                u.no_hp AS user_no_hp, -- Mengambil no_hp dari user
                m.brand AS motor_brand,
                m.type AS motor_type
            FROM pembayaran p
            JOIN reservasi r ON p.reservasi_id = r.id
            JOIN users u ON r.user_id = u.id
            JOIN motors m ON r.motor_id = m.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.status && filters.status !== 'all') {
            query += ' AND p.status_pembayaran = ?';
            params.push(filters.status);
        }

        if (filters.search) {
            const searchTerm = `%${filters.search.toLowerCase()}%`;
            query += ` AND (LOWER(u.nama_lengkap) LIKE ? OR LOWER(m.brand) LIKE ? OR LOWER(m.type) LIKE ? OR u.no_hp LIKE ?)`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY p.created_at DESC';

        const [rows] = await connection.execute(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error in getAllPayments (admin):', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data pembayaran.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// Fungsi untuk memperbarui status pembayaran (oleh admin)
const updatePaymentStatus = async (req, res) => {
    let connection;
    try {
        const { id } = req.params; // id pembayaran
        const { status, admin_notes } = req.body;

        const validStatuses = ['pending', 'verified', 'rejected'];
        if (!status || !validStatuses.includes(status.toLowerCase())) {
            return res.status(400).json({ success: false, message: 'Status pembayaran tidak valid.' });
        }

        connection = await db.getConnection();
        await connection.beginTransaction(); // Mulai transaksi untuk atomicity

        const [paymentRows] = await connection.execute(
            'SELECT reservasi_id FROM pembayaran WHERE id = ?',
            [id]
        );
        const payment = paymentRows[0];

        if (!payment) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Pembayaran tidak ditemukan.' });
        }

        // Perbarui status pembayaran di tabel `pembayaran`
        await connection.execute(
            'UPDATE pembayaran SET status_pembayaran = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status.toLowerCase(), admin_notes, id]
        );

        let newReservationStatus;
        let newMotorStatus = null; // Status motor yang akan diatur

        if (status.toLowerCase() === 'verified') {
            newReservationStatus = 'confirmed';
            newMotorStatus = 'rented'; // Motor disewa jika pembayaran diverifikasi
        } else if (status.toLowerCase() === 'rejected') {
            newReservationStatus = 'cancelled'; // Jika pembayaran ditolak, batalkan reservasi
            newMotorStatus = 'available'; // Motor kembali tersedia jika dibatalkan
        }

        // Perbarui status reservasi
        if (newReservationStatus) {
            await connection.execute(
                'UPDATE reservasi SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [newReservationStatus, payment.reservasi_id]
            );

            // Perbarui status motor terkait jika diperlukan
            if (newMotorStatus) {
                const [reservationDetails] = await connection.execute(
                    'SELECT motor_id FROM reservasi WHERE id = ?',
                    [payment.reservasi_id]
                );
                const motorId = reservationDetails[0]?.motor_id;
                if (motorId) {
                    await connection.execute(
                        'UPDATE motors SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                        [newMotorStatus, motorId]
                    );
                    console.log(`Motor ${motorId} status diubah menjadi '${newMotorStatus}'`);
                }
            }
        }

        await connection.commit(); // Komit transaksi
        res.status(200).json({ success: true, message: `Status pembayaran diperbarui menjadi ${status}.` });

    } catch (error) {
        console.error('Error in updatePaymentStatus (admin):', error);
        if (connection) await connection.rollback(); // Rollback jika ada error
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat memperbarui status pembayaran.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    uploadPaymentProof,
    getAllPayments,
    updatePaymentStatus,
    handlePaymentApproval
};
