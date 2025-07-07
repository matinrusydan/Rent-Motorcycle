// backend/controllers/motorController.js
const Motor = require('../models/Motor');
const fs = require('fs'); // Menggunakan fs biasa untuk existsSync
const fsp = require('fs').promises; // Menggunakan fs.promises untuk operasi async
const path = require('path');
const db = require('../config/db'); 


const checkMotorFutureReservations = async (req, res) => {
    let connection;
    try {
        const { id } = req.params; // ID motor yang akan diperiksa
        const currentDate = new Date().toISOString().slice(0, 10); // Tanggal hari ini YYYY-MM-DD

        connection = await db.getConnection();
        const [rows] = await connection.execute(
            `SELECT COUNT(id) AS futureBookingsCount
            FROM reservasi
            WHERE motor_id = ?
            AND tanggal_selesai >= ? -- Reservasi berakhir hari ini atau di masa depan
            AND status IN ('pending', 'confirmed')`,
            [id, currentDate]
        );

        const hasFutureBookings = rows[0].futureBookingsCount > 0;
        res.json({ success: true, hasFutureBookings: hasFutureBookings, count: rows[0].futureBookingsCount });

    } catch (error) {
        console.error('Error in checkMotorFutureReservations:', error);
        res.status(500).json({ success: false, message: 'Gagal memeriksa reservasi masa depan motor.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

const getAllMotors = async (req, res) => {
    try {
        const filters = {
            search: req.query.search,
            brand: req.query.brand,
            status: req.query.status,
            limit: req.query.limit,
            offset: req.query.offset
        };

        const motors = await Motor.getAll(filters);
        const stats = await Motor.getStats();

        res.json({
            success: true,
            data: motors,
            stats: stats,
            message: 'Motors retrieved successfully'
        });
    } catch (error) {
        console.error('Error in getAllMotors:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getMotorById = async (req, res) => {
    try {
        const { id } = req.params;
        const motor = await Motor.getById(id);

        if (!motor) {
            return res.status(404).json({
                success: false,
                message: 'Motor not found'
            });
        }

        res.json({
            success: true,
            data: motor,
            message: 'Motor retrieved successfully'
        });
    } catch (error) {
        console.error('Error in getMotorById:', error);
        res.status(500).json({
            success: false,
            message: `Failed to retrieve motor: ${error.message}`
        });
    }
};

const getMotorAvailability = async (req, res) => {
    let connection;
    try {
        const { motorId } = req.params;
        const { start_date, end_date } = req.query;

        if (!motorId || !start_date || !end_date) {
            return res.status(400).json({ success: false, message: 'Motor ID, tanggal mulai, dan tanggal akhir wajib diisi.' });
        }

        const startDateObj = new Date(start_date);
        const endDateObj = new Date(end_date);

        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
            return res.status(400).json({ success: false, message: 'Format tanggal tidak valid.' });
        }

        connection = await db.getConnection();

        const [reservations] = await connection.execute(
            `SELECT tanggal_mulai, tanggal_selesai
            FROM reservasi
            WHERE motor_id = ?
            AND status IN ('pending', 'confirmed', 'completed')
            AND (
                (tanggal_mulai <= ? AND tanggal_selesai >= ?)
            )`,
            [
                motorId,
                endDateObj.toISOString().slice(0, 10),
                startDateObj.toISOString().slice(0, 10)
            ]
        );

        res.json({ success: true, data: { motorId: motorId, reservations: reservations } });

    } catch (error) {
        console.error('Error in getMotorAvailability:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil ketersediaan motor.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

const createMotor = async (req, res) => {
    console.log('req.body in createMotor:', req.body);
    console.log('req.file in createMotor:', req.file); 
    try {
        // Asumsi `gambar_motor` adalah path file yang diupload oleh multer
        const motorData = {
            ...req.body,
            gambar_motor: req.file ? req.file.path.replace(/\\/g, '/') : null // Ganti backslash dengan forward slash untuk konsistensi path URL
        };

        const newMotor = await Motor.create(motorData);
        res.status(201).json({
            success: true,
            message: 'Motor created successfully',
            data: newMotor
        });
    } catch (error) {
        console.error('Error creating motor:', error);
        // Jika ada file yang diupload dan terjadi error, hapus file tersebut
        if (req.file && fs.existsSync(req.file.path)) { // Menggunakan fs.existsSync (sync)
            fs.unlinkSync(req.file.path); // Menggunakan fs.unlinkSync (sync)
        }
        res.status(500).json({
            success: false,
            message: `Failed to create motor: ${error.message}`
        });
    }
};

const updateMotor = async (req, res) => {
    try {
        const { id } = req.params;
        const motorData = { ...req.body };
        let oldMotor = await Motor.getById(id); // Ambil data motor lama

        if (!oldMotor) {
            return res.status(404).json({ success: false, message: 'Motor not found.' });
        }

        if (req.file) {
            motorData.gambar_motor = req.file.path.replace(/\\/g, '/');
            // Hapus gambar lama jika ada dan berbeda dengan yang baru
            if (oldMotor.gambar_motor && oldMotor.gambar_motor !== motorData.gambar_motor) {
                const oldImagePath = path.join(__dirname, '..', oldMotor.gambar_motor);
                try {
                    // Gunakan fsp.access dan fsp.unlink untuk operasi async/await
                    if (await fsp.access(oldImagePath).then(() => true).catch(() => false)) {
                        await fsp.unlink(oldImagePath);
                        console.log('Old image deleted:', oldImagePath);
                    }
                } catch (unlinkError) {
                    console.warn('Could not delete old image (might not exist):', oldImagePath, unlinkError.message);
                }
            }
        }

        const updatedMotor = await Motor.update(id, motorData);

        if (!updatedMotor) {
            return res.status(404).json({
                success: false,
                message: 'Motor not found or no changes made.'
            });
        }

        res.json({
            success: true,
            message: 'Motor updated successfully',
            data: updatedMotor
        });
    } catch (error) {
        console.error('Error updating motor:', error);
        // Jika ada file baru diupload dan terjadi error update, hapus file baru tersebut
        if (req.file && fs.existsSync(req.file.path)) { // Menggunakan fs.existsSync (sync)
            fs.unlinkSync(req.file.path); // Menggunakan fs.unlinkSync (sync)
        }
        res.status(500).json({
            success: false,
            message: `Failed to update motor: ${error.message}`
        });
    }
};

const deleteMotor = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await db.getConnection(); // Get connection here

        // 1. Periksa apakah ada reservasi terkait yang masih aktif/pending/confirmed
        const [futureReservations] = await connection.execute(
            `SELECT COUNT(id) AS count
            FROM reservasi
            WHERE motor_id = ?
            AND status IN ('pending', 'confirmed')`, // Fokus pada reservasi yang belum selesai
            [id]
        );

        if (futureReservations[0].count > 0) {
            // Jika ada reservasi aktif/pending, tolak penghapusan
            return res.status(400).json({ 
                success: false, 
                message: `Motor ini tidak dapat dihapus karena masih memiliki ${futureReservations[0].count} reservasi yang sedang berjalan atau menunggu konfirmasi. Mohon selesaikan atau batalkan reservasi tersebut terlebih dahulu.` 
            });
        }

        // 2. Jika tidak ada reservasi aktif, lanjutkan penghapusan
        const motor = await Motor.getById(id); // Ambil data motor untuk mendapatkan path gambar

        if (!motor) {
            return res.status(404).json({ success: false, message: 'Motor not found.' });
        }

        const deleteResult = await Motor.delete(id);

        // Hapus file gambar setelah motor dihapus dari database
        if (motor.gambar_motor) {
            const imagePath = path.join(__dirname, '..', motor.gambar_motor);
            try {
                // Gunakan fsp.access dan fsp.unlink untuk operasi async/await
                if (await fsp.access(imagePath).then(() => true).catch(() => false)) {
                    await fsp.unlink(imagePath);
                    console.log('Image deleted:', imagePath);
                } else {
                    console.warn('Image file not found for deletion:', imagePath);
                }
            } catch (unlinkError) {
                console.warn('Could not delete image file (permission or other error):', imagePath, unlinkError.message);
            }
        }

        res.json({
            success: true,
            message: deleteResult.message
        });
    } catch (error) {
        console.error('Error deleting motor:', error);
        res.status(500).json({
            success: false,
            message: `Failed to delete motor: ${error.message}`
        });
    } finally {
        if (connection) connection.release(); // Release connection in finally
    }
};

const bulkDeleteMotors = async (req, res) => {
    let connection;
    try {
        const { ids } = req.body; // ids diharapkan berupa array ID motor
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or empty array of IDs provided.' });
        }

        connection = await db.getConnection(); // Get connection here

        const motorsToDelete = [];
        const motorsWithActiveReservations = [];

        // Periksa setiap motor untuk reservasi aktif sebelum menghapus
        for (const id of ids) {
            const [futureReservations] = await connection.execute(
                `SELECT COUNT(id) AS count FROM reservasi WHERE motor_id = ? AND status IN ('pending', 'confirmed')`,
                [id]
            );

            if (futureReservations[0].count > 0) {
                motorsWithActiveReservations.push(id);
            } else {
                const motor = await Motor.getById(id);
                if (motor && motor.gambar_motor) {
                    motorsToDelete.push({ id: motor.id, gambar_motor: motor.gambar_motor });
                }
            }
        }

        if (motorsWithActiveReservations.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Tidak dapat menghapus motor dengan ID berikut: ${motorsWithActiveReservations.join(', ')}. Mereka masih memiliki reservasi aktif atau pending.`
            });
        }

        const deleteIds = motorsToDelete.map(m => m.id);
        if (deleteIds.length === 0) {
             return res.status(200).json({ success: true, message: 'Tidak ada motor yang dapat dihapus.' });
        }

        const affectedRows = await Motor.bulkDelete(deleteIds);

        // Hapus file gambar yang terkait
        for (const motor of motorsToDelete) {
            const imagePath = path.join(__dirname, '..', motor.gambar_motor);
            try {
                if (await fsp.access(imagePath).then(() => true).catch(() => false)) {
                    await fsp.unlink(imagePath);
                    console.log('Bulk deleted image:', imagePath);
                } else {
                    console.warn('Could not delete image file during bulk delete (might not exist):', imagePath, unlinkError.message);
                }
            } catch (unlinkError) {
                console.warn('Could not delete image file during bulk delete (permission or other error):', imagePath, unlinkError.message);
            }
        }

        res.json({
            success: true,
            message: `${affectedRows} motor berhasil dihapus.`,
            deletedCount: affectedRows
        });
    } catch (error) {
        console.error('Error in bulkDeleteMotors:', error);
        res.status(500).json({
            success: false,
            message: `Failed to delete motors: ${error.message}`
        });
    } finally {
        if (connection) connection.release();
    }
};

const getMotorStats = async (req, res) => {
    try {
        const stats = await Motor.getStats();

        res.json({
            success: true,
            data: stats,
            message: 'Motor statistics retrieved successfully.'
        });
    } catch (error) {
        console.error('Error in getMotorStats:', error);
        res.status(500).json({
            success: false,
            message: `Failed to get motor statistics: ${error.message}`
        });
    }
};


// Perbaikan untuk motorController.js - getAvailableMotors function

const getAvailableMotors = async (req, res) => {
    let connection;
    try {
        const { tanggal_mulai, lama_sewa, brand } = req.query;
        let tanggalSelesaiFormatted;

        // Validasi input tanggal dan lama sewa
        if (tanggal_mulai && lama_sewa) {
            const startDate = new Date(tanggal_mulai);
            const duration = parseInt(lama_sewa);

            // Validasi format tanggal
            if (isNaN(startDate.getTime())) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Format tanggal_mulai tidak valid. Gunakan format YYYY-MM-DD.' 
                });
            }

            // Validasi lama sewa
            if (isNaN(duration) || duration <= 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Lama_sewa tidak valid (harus angka positif).' 
                });
            }

            // Validasi tanggal tidak boleh di masa lalu
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            startDate.setHours(0, 0, 0, 0);
            
            if (startDate < today) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Tanggal mulai sewa tidak boleh di masa lalu.' 
                });
            }

            // Hitung tanggal selesai
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + duration);
            tanggalSelesaiFormatted = endDate.toISOString().slice(0, 10);
        }

        connection = await db.getConnection();

        // Base query untuk motor yang tersedia
        let query = `
            SELECT
                m.id,
                m.brand,
                m.type,
                m.price,
                m.specs,
                m.status,
                m.description,
                m.gambar_motor,
                m.image,
                m.created_at,
                m.updated_at,
                -- Hitung jumlah reservasi aktif untuk motor ini
                (SELECT COUNT(*) 
                 FROM reservasi r 
                 WHERE r.motor_id = m.id 
                 AND r.status IN ('pending', 'confirmed')) as active_reservations
            FROM motors m
            WHERE m.status = 'available'
        `;
        const params = [];

        // Filter berdasarkan brand jika disediakan
        if (brand && brand !== 'all' && brand.trim() !== '') {
            query += ' AND LOWER(m.brand) = LOWER(?)';
            params.push(brand.trim());
        }

        // Logika pengecekan overlap reservasi jika tanggal dan lama sewa disediakan
        if (tanggal_mulai && tanggalSelesaiFormatted) {
            query += `
                AND m.id NOT IN (
                    SELECT DISTINCT r.motor_id
                    FROM reservasi r
                    WHERE r.status IN ('pending', 'confirmed', 'completed')
                    AND NOT (
                        -- Tidak ada overlap jika:
                        -- 1. Reservasi berakhir sebelum permintaan dimulai
                        r.tanggal_selesai < ? 
                        OR 
                        -- 2. Reservasi dimulai setelah permintaan berakhir
                        r.tanggal_mulai > ?
                    )
                )
            `;
            params.push(tanggal_mulai, tanggalSelesaiFormatted);
        }

        query += ' ORDER BY m.brand ASC, m.type ASC';

        console.log('Executing query:', query);
        console.log('With parameters:', params);

        const [motors] = await connection.execute(query, params);


        console.log(`Found ${motors.length} available motors`);
        if (tanggal_mulai && lama_sewa) {
            console.log(`For period: ${tanggal_mulai} to ${tanggalSelesaiFormatted} (${lama_sewa} days)`);
        }

        const motorsWithAvailability = motors.map(motor => ({
            ...motor,
            is_available_for_period: tanggal_mulai && lama_sewa ? true : null,
            requested_period: tanggal_mulai && lama_sewa ? {
                start_date: tanggal_mulai,
                end_date: tanggalSelesaiFormatted,
                duration_days: parseInt(lama_sewa)
            } : null
        }));

        res.json({ 
            success: true, 
            data: motorsWithAvailability, 
            message: 'Available motors retrieved successfully.',
            filter_applied: {
                date_filter: !!(tanggal_mulai && lama_sewa),
                brand_filter: !!brand,
                total_found: motors.length
            }
        });

    } catch (error) {
        console.error('Error in getAvailableMotors:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Gagal mengambil daftar motor yang tersedia.', 
            error: error.message 
        });
    } finally {
        if (connection) connection.release();
    }
};

const checkDateOverlap = (start1, end1, start2, end2) => {

    const date1Start = new Date(start1);
    const date1End = new Date(end1);
    const date2Start = new Date(start2);
    const date2End = new Date(end2);
    

    return !(date1End < date2Start || date2End < date1Start);
};

const getMotorAvailabilityDetails = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { start_date, end_date } = req.query;

        connection = await db.getConnection();

        const [motorResult] = await connection.execute(
            'SELECT * FROM motors WHERE id = ? AND status = "available"',
            [id]
        );

        if (motorResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Motor tidak ditemukan atau tidak tersedia.'
            });
        }

        const motor = motorResult[0];

        let reservationQuery = `
            SELECT 
                id,
                tanggal_mulai,
                tanggal_selesai,
                status,
                user_id
            FROM reservasi 
            WHERE motor_id = ? 
            AND status IN ('pending', 'confirmed', 'completed')
        `;
        const queryParams = [id];

        if (start_date && end_date) {
            reservationQuery += ' AND NOT (tanggal_selesai < ? OR tanggal_mulai > ?)';
            queryParams.push(start_date, end_date);
        }

        reservationQuery += ' ORDER BY tanggal_mulai ASC';

        const [reservations] = await connection.execute(reservationQuery, queryParams);

        let isAvailable = true;
        if (start_date && end_date) {
            isAvailable = reservations.length === 0;
        }

        res.json({
            success: true,
            data: {
                motor: motor,
                reservations: reservations,
                is_available_for_requested_period: isAvailable,
                requested_period: start_date && end_date ? {
                    start_date,
                    end_date
                } : null
            },
            message: 'Motor availability details retrieved successfully.'
        });

    } catch (error) {
        console.error('Error in getMotorAvailabilityDetails:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil detail ketersediaan motor.',
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};



const getAvailableMotorsPublic = async (req, res) => {
    let connection;
    try {
        const { tanggal_mulai, lama_sewa, brand } = req.query;
        let tanggalSelesaiFormatted;

        if (tanggal_mulai && lama_sewa) {
            const startDate = new Date(tanggal_mulai);
            const duration = parseInt(lama_sewa);

            if (isNaN(startDate.getTime())) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Format tanggal_mulai tidak valid. Gunakan format YYYY-MM-DD.' 
                });
            }

            if (isNaN(duration) || duration <= 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Lama_sewa tidak valid (harus angka positif).' 
                });
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            startDate.setHours(0, 0, 0, 0);
            
            if (startDate < today) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Tanggal mulai sewa tidak boleh di masa lalu.' 
                });
            }

            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + duration);
            tanggalSelesaiFormatted = endDate.toISOString().slice(0, 10);
        }

        connection = await db.getConnection();

        let query = `
            SELECT
                m.id,
                m.brand,
                m.type,
                m.price,
                m.specs,
                m.status,
                m.description,
                m.gambar_motor,
                m.created_at,
                m.updated_at
            FROM motors m
            WHERE m.status = 'available'
        `;
        const params = [];

        if (brand && brand !== 'all' && brand.trim() !== '') {
            query += ' AND LOWER(m.brand) = LOWER(?)';
            params.push(brand.trim());
        }

        if (tanggal_mulai && tanggalSelesaiFormatted) {
            query += `
                AND m.id NOT IN (
                    SELECT DISTINCT r.motor_id
                    FROM reservasi r
                    WHERE r.status IN ('pending', 'confirmed', 'completed')
                    AND NOT (
                        r.tanggal_selesai < ? 
                        OR 
                        r.tanggal_mulai > ?
                    )
                )
            `;
            params.push(tanggal_mulai, tanggalSelesaiFormatted);
        }

        query += ' ORDER BY m.brand ASC, m.type ASC';

        console.log('Public Motors Query:', query);
        console.log('Public Motors Params:', params);

        const [motors] = await connection.execute(query, params);

        console.log(`Found ${motors.length} available motors for public`);

        res.json({ 
            success: true, 
            data: motors, 
            message: 'Available motors retrieved successfully.',
            total_found: motors.length
        });

    } catch (error) {
        console.error('Error in getAvailableMotorsPublic:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Gagal mengambil daftar motor yang tersedia.', 
            error: error.message 
        });
    } finally {
        if (connection) connection.release();
    }
};


module.exports = {
    getAllMotors,
    getMotorById,
    createMotor,
    updateMotor,
    deleteMotor,
    bulkDeleteMotors,
    getMotorStats,
    getAvailableMotors,
    checkMotorFutureReservations,
    getMotorAvailabilityDetails,
    checkDateOverlap,
    getMotorAvailability,
    getAvailableMotorsPublic
};
