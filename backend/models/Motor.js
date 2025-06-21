// backend/models/Motor.js
const db = require('../config/db');

class Motor {
    // Get all motors with optional filtering
    static async getAll(filters = {}) {
        try {
            let query = 'SELECT * FROM motors WHERE 1=1';
            const params = [];

            // Add search filter
            if (filters.search) {
                query += ' AND (brand LIKE ? OR type LIKE ? OR specs LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            // Add brand filter
            if (filters.brand && filters.brand !== 'all') {
                query += ' AND brand = ?';
                params.push(filters.brand);
            }

            // Add status filter
            if (filters.status && filters.status !== 'all') {
                query += ' AND status = ?';
                params.push(filters.status);
            }

            // Add sorting
            query += ' ORDER BY created_at DESC';

            // Add pagination if provided
            if (filters.limit) {
                query += ' LIMIT ?';
                params.push(parseInt(filters.limit));

                if (filters.offset) {
                    query += ' OFFSET ?';
                    params.push(parseInt(filters.offset));
                }
            }

            const [rows] = await db.query(query, params);
            return rows;
        } catch (error) {
            throw new Error(`Error fetching motors: ${error.message}`);
        }
    }

    // Get motor by ID
    static async getById(id) {
        try {
            const [rows] = await db.query('SELECT * FROM motors WHERE id = ?', [id]);
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Error fetching motor: ${error.message}`);
        }
    }

    // Create new motor
    static async create(motorData) {
        try {
            const { brand, type, harga_sewa, specs, status, description, gambar_motor } = motorData;

            const query = `
                INSERT INTO motors (brand, type, harga_sewa, specs, status, description, gambar_motor)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await db.query(query, [
                brand, type, harga_sewa, specs, status || 'available', description, gambar_motor
            ]);

            return await Motor.getById(result.insertId);
        } catch (error) {
            throw new Error(`Error creating motor: ${error.message}`);
        }
    }

    // Update motor
    static async update(id, motorData) {
        try {
            const { brand, type, harga_sewa, specs, status, description, gambar_motor } = motorData;

            let query = `
                UPDATE motors
                SET brand = ?, type = ?, harga_sewa = ?, specs = ?, status = ?, description = ?
            `;
            const params = [brand, type, harga_sewa, specs, status, description];

            // Only update image if provided
            if (gambar_motor) {
                query += ', gambar_motor = ?';
                params.push(gambar_motor);
            }

            query += ' WHERE id = ?';
            params.push(id);

            const [result] = await db.query(query, params);

            if (result.affectedRows === 0) {
                return null;
            }

            return await Motor.getById(id);
        } catch (error) {
            throw new Error(`Error updating motor: ${error.message}`);
        }
    }

    // Delete motor
    static async delete(id) {
        try {
            const [result] = await db.query('DELETE FROM motors WHERE id = ?', [id]);

            if (result.affectedRows === 0) {
                throw new Error('Motor not found');
            }

            return { message: 'Motor deleted successfully' };
        } catch (error) {
            throw new Error(`Error deleting motor: ${error.message}`);
        }
    }

    // Bulk delete motors
    static async bulkDelete(ids) {
        try {
            if (!ids || ids.length === 0) {
                throw new Error('No IDs provided for deletion');
            }

            const placeholders = ids.map(() => '?').join(',');
            const query = `DELETE FROM motors WHERE id IN (${placeholders})`;

            const [result] = await db.query(query, ids);

            return result.affectedRows;
        } catch (error) {
            throw new Error(`Error bulk deleting motors: ${error.message}`);
        }
    }

    // Get motor statistics
    static async getStats() {
        try {
            const [stats] = await db.query(`
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
                    SUM(CASE WHEN status = 'rented' THEN 1 ELSE 0 END) as rented,
                    SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance
                FROM motors
            `);

            return stats[0];
        } catch (error) {
            throw new Error(`Error fetching motor stats: ${error.message}`);
        }
    }
}

module.exports = Motor;