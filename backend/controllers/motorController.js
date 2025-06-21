// backend/controllers/motorController.js
const Motor = require('../models/Motor');
const fs = require('fs').promises;
const path = require('path');

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

const createMotor = async (req, res) => {
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
        if (req.file && fs.existsSync(req.file.path)) {
            await fs.unlink(req.file.path);
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
                    await fs.unlink(oldImagePath);
                    console.log('Old image deleted:', oldImagePath);
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
        if (req.file && fs.existsSync(req.file.path)) {
            await fs.unlink(req.file.path);
        }
        res.status(500).json({
            success: false,
            message: `Failed to update motor: ${error.message}`
        });
    }
};

const deleteMotor = async (req, res) => {
    try {
        const { id } = req.params;
        const motor = await Motor.getById(id); // Ambil data motor untuk mendapatkan path gambar

        if (!motor) {
            return res.status(404).json({ success: false, message: 'Motor not found.' });
        }

        const deleteResult = await Motor.delete(id);

        // Hapus file gambar setelah motor dihapus dari database
        if (motor.gambar_motor) {
            const imagePath = path.join(__dirname, '..', motor.gambar_motor);
            try {
                await fs.unlink(imagePath);
                console.log('Image deleted:', imagePath);
            } catch (unlinkError) {
                console.warn('Could not delete image file (might not exist):', imagePath, unlinkError.message);
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
    }
};

const bulkDeleteMotors = async (req, res) => {
    try {
        const { ids } = req.body; // ids diharapkan berupa array ID motor
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or empty array of IDs provided.' });
        }

        // Ambil path gambar untuk semua motor yang akan dihapus
        const motorsToDelete = [];
        for (const id of ids) {
            const motor = await Motor.getById(id);
            if (motor && motor.gambar_motor) {
                motorsToDelete.push(motor.gambar_motor);
            }
        }

        const affectedRows = await Motor.bulkDelete(ids);

        // Hapus file gambar yang terkait
        for (const gambar_motor of motorsToDelete) {
            const imagePath = path.join(__dirname, '..', gambar_motor);
            try {
                await fs.unlink(imagePath);
                console.log('Bulk deleted image:', imagePath);
            } catch (unlinkError) {
                console.warn('Could not delete image file during bulk delete (might not exist):', imagePath, unlinkError.message);
            }
        }

        res.json({
            success: true,
            message: `${affectedRows} motors deleted successfully.`
        });
    } catch (error) {
        console.error('Error in bulkDeleteMotors:', error);
        res.status(500).json({
            success: false,
            message: `Failed to delete motors: ${error.message}`
        });
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

const getAvailableMotors = async (req, res) => {
    try {
        const filters = {
            status: 'available' // Hanya ambil yang tersedia
            // Filter lain seperti brand, search bisa ditambahkan dari req.query jika diperlukan
        };
        // *** PERBAIKAN DI SINI: Ubah Motor.findAll menjadi Motor.getAll ***
        const motors = await Motor.getAll(filters); 
        res.json({ success: true, data: motors, message: 'Available motors retrieved successfully.' });
    } catch (error) {
        console.error('Error in getAvailableMotors:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil daftar motor yang tersedia.', error: error.message });
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
    getAvailableMotors // Pastikan ini diekspor
};