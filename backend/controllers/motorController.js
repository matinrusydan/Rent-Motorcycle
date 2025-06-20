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
            message: error.message
        });
    }
};

const createMotor = async (req, res) => {
    try {
        const motorData = {
            brand: req.body.brand,
            type: req.body.type,
            harga_sewa: parseFloat(req.body.harga_sewa),
            specs: req.body.specs,
            status: req.body.status || 'available',
            description: req.body.description,
            gambar_motor: req.file ? req.file.path.replace(/\\/g, '/') : null
        };

        // Validation
        if (!motorData.brand || !motorData.type || !motorData.harga_sewa || !motorData.specs || !motorData.status) {
            if (req.file) {
                try {
                    await fs.unlink(req.file.path);
                } catch (err) {
                    console.warn('Failed to delete uploaded file:', err);
                }
            }
            return res.status(400).json({
                success: false,
                message: 'Brand, type, price, specs, and status are required.'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Motor image is required.'
            });
        }

        const newMotor = await Motor.create(motorData);

        res.status(201).json({
            success: true,
            data: newMotor,
            message: 'Motor created successfully.'
        });
    } catch (error) {
        console.error('Error in createMotor:', error);
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (err) {
                console.warn('Failed to delete uploaded file:', err);
            }
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
        
        const motorData = {
            brand: req.body.brand,
            type: req.body.type,
            harga_sewa: parseFloat(req.body.harga_sewa),
            specs: req.body.specs,
            status: req.body.status,
            description: req.body.description,
            gambar_motor: req.file ? req.file.path.replace(/\\/g, '/') : null
        };

        let oldMotorImage = null;
        if (req.file) {
            const oldMotor = await Motor.getById(id);
            if (oldMotor) {
                oldMotorImage = oldMotor.gambar_motor;
            }
        }

        const updatedMotor = await Motor.update(id, motorData);

        if (!updatedMotor) {
            if (req.file) {
                try {
                    await fs.unlink(req.file.path);
                } catch (err) {
                    console.warn('Failed to delete uploaded file:', err);
                }
            }
            return res.status(404).json({
                success: false,
                message: 'Motor not found.'
            });
        }

        if (req.file && oldMotorImage) {
            try {
                const oldImagePath = path.join(__dirname, '..', oldMotorImage);
                await fs.unlink(oldImagePath);
                console.log(`Old image deleted: ${oldImagePath}`);
            } catch (fileError) {
                console.warn('Warning: Failed to delete old image:', fileError.message);
            }
        }

        res.json({
            success: true,
            data: updatedMotor,
            message: 'Motor updated successfully.'
        });
    } catch (error) {
        console.error('Error in updateMotor:', error);
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (err) {
                console.warn('Failed to delete uploaded file:', err);
            }
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
        
        const motor = await Motor.getById(id);
        if (!motor) {
            return res.status(404).json({
                success: false,
                message: 'Motor not found.'
            });
        }

        await Motor.delete(id);

        if (motor.gambar_motor) {
            try {
                const imagePath = path.join(__dirname, '..', motor.gambar_motor);
                await fs.unlink(imagePath);
                console.log(`Motor image deleted: ${imagePath}`);
            } catch (fileError) {
                console.warn('Warning: Failed to delete image file:', fileError.message);
            }
        }

        res.json({
            success: true,
            message: 'Motor deleted successfully.'
        });
    } catch (error) {
        console.error('Error in deleteMotor:', error);
        res.status(500).json({
            success: false,
            message: `Failed to delete motor: ${error.message}`
        });
    }
};

const bulkDeleteMotors = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid motor IDs for deletion.'
            });
        }

        const motorsToDelete = await Promise.all(ids.map(id => Motor.getById(id)));
        const deletedCount = await Motor.bulkDelete(ids);

        const imageCleanupPromises = motorsToDelete
            .filter(motor => motor && motor.gambar_motor)
            .map(motor => {
                const imagePath = path.join(__dirname, '..', motor.gambar_motor);
                return fs.unlink(imagePath)
                    .catch(err => console.warn('Warning: Failed to delete image:', err.message));
            });

        await Promise.all(imageCleanupPromises);

        res.json({
            success: true,
            message: `${deletedCount} motors deleted successfully.`,
            deletedCount: deletedCount
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
        const motors = await Motor.findAll(filters);
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
    getAvailableMotors
};