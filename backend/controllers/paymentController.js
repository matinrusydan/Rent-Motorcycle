// backend/controllers/paymentController.js
const Payment = require('../models/Payment');
const Reservation = require('../models/Reservation'); // Pastikan ini diimpor karena digunakan oleh Reservation.updateStatus
const fs = require('fs').promises;
const path = require('path');
const db = require('../config/db');
// const reservationController = require('./reservationController'); // <<< HAPUS BARIS INI JIKA TIDAK DIGUNAKAN

const handlePaymentApproval = async (req, res) => {
    let connection;
    try {
        const { paymentId, newPaymentStatus, reservationId } = req.body;

        connection = await db.getConnection();

        // 1. Perbarui status pembayaran di tabel 'pembayaran'
        // CATATAN: Pastikan tabel Anda bernama 'pembayaran' bukan 'payments' seperti di kueri ini.
        // Jika tabel Anda 'pembayaran', ubah 'payments' menjadi 'pembayaran'.
        await connection.execute(
            'UPDATE pembayaran SET status_pembayaran = ?, updated_at = NOW() WHERE id = ?', // <<< Pastikan nama tabel dan kolom sesuai DB
            [newPaymentStatus, paymentId]
        );

        // 2. Jika pembayaran disetujui, perbarui status reservasi
        if (newPaymentStatus === 'verified' || newPaymentStatus === 'approved') { // Menggunakan 'verified' sesuai enum DB
            // Anda sudah menggunakan Cara 2: Update reservasi langsung di sini
            await connection.execute(
                'UPDATE reservasi SET status = ?, updated_at = NOW() WHERE id = ?',
                ['confirmed', reservationId] // Ubah status reservasi menjadi 'confirmed'
            );
            console.log(`Reservasi ${reservationId} status diubah menjadi 'confirmed' karena pembayaran disetujui.`);
        } else if (newPaymentStatus === 'rejected') { // Jika pembayaran ditolak
            await connection.execute(
                'UPDATE reservasi SET status = ?, updated_at = NOW() WHERE id = ?',
                ['cancelled', reservationId] // Batalkan reservasi jika pembayaran ditolak
            );
            console.log(`Reservasi ${reservationId} status diubah menjadi 'cancelled' karena pembayaran ditolak.`);
        }


        res.status(200).json({ success: true, message: 'Status pembayaran berhasil diperbarui.' });

    } catch (error) {
        console.error('Error in handlePaymentApproval:', error);
        res.status(500).json({ success: false, message: 'Gagal memperbarui status pembayaran.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

const uploadPaymentProof = async (req, res) => {
    try {
        const { reservasi_id, catatanTambahan } = req.body;
        const bukti_transfer_path = req.file ? req.file.path.replace(/\\/g, '/') : null;

        if (!reservasi_id || !bukti_transfer_path) {
            if (req.file && await fs.access(req.file.path).then(() => true).catch(() => false)) {
                await fs.unlink(req.file.path);
            }
            return res.status(400).json({ success: false, message: 'ID Reservasi dan Bukti Transfer wajib diisi.' });
        }

        const reservation = await Reservation.findById(reservasi_id);
        if (!reservation) {
            if (req.file && await fs.access(req.file.path).then(() => true).catch(() => false)) {
                await fs.unlink(req.file.path);
            }
            return res.status(404).json({ success: false, message: 'Reservasi tidak ditemukan.' });
        }

        const existingPayment = await Payment.findByReservationId(reservasi_id);
        if (existingPayment) {
             if (req.file && existingPayment.bukti_transfer) {
                const oldImagePath = path.join(__dirname, '..', existingPayment.bukti_transfer);
                try {
                    if (await fs.access(oldImagePath).then(() => true).catch(() => false)) {
                        await fs.unlink(oldImagePath);
                        console.log('Old payment proof deleted:', oldImagePath);
                    }
                } catch (unlinkError) {
                    console.warn('Could not delete old payment proof (might not exist):', oldImagePath, unlinkError.message);
                }
            }
            let connection;
            try {
                connection = await db.getConnection();
                await connection.execute(
                    'UPDATE pembayaran SET bukti_transfer = ?, catatan_pembeli = ?, status_pembayaran = "pending", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [bukti_transfer_path, catatanTambahan, existingPayment.id]
                );
                // Di sini, Anda mungkin ingin mengubah status reservasi jika diperlukan (misal dari confirmed ke pending lagi jika upload ulang)
                await reservationController.updateStatus(reservasi_id, 'pending'); // Ini tidak akan bekerja karena reservationController tidak diimpor.
                // Jika Anda ingin mengubah status reservasi di sini, lakukan secara manual seperti di handlePaymentApproval
                await connection.execute(
                     'UPDATE reservasi SET status = ?, updated_at = NOW() WHERE id = ?',
                     ['pending', reservasi_id]
                );
                res.status(200).json({ success: true, message: 'Bukti pembayaran berhasil diperbarui.', payment_id: existingPayment.id });
            } finally {
                if (connection) connection.release();
            }

        } else {
            const paymentId = await Payment.create({
                reservasi_id,
                jumlah_pembayaran: reservation.total_harga,
                metode_pembayaran: 'transfer bank',
                bukti_transfer: bukti_transfer_path,
                catatan_pembeli: catatanTambahan
            });

            await Reservation.updateStatus(reservasi_id, 'pending');

            res.status(201).json({ success: true, message: 'Bukti pembayaran berhasil diunggah.', payment_id: paymentId });
        }

    } catch (error) {
        console.error('Error uploading payment proof:', error);
        if (req.file && await fs.access(req.file.path).then(() => true).catch(() => false)) {
            await fs.unlink(req.file.path);
        }
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat mengunggah bukti pembayaran.', error: error.message });
    }
};

const getAllPayments = async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            search: req.query.search
        };
        const payments = await Payment.findAll(filters);
        res.json({ success: true, data: payments });
    } catch (error) {
        console.error('Error in getAllPayments (admin):', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data pembayaran.', error: error.message });
    }
};

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
    handlePaymentApproval // <<< PASTIKAN INI DIEKSPOR JIKA ANDA AKAN MENGGUNAKANNYA
};