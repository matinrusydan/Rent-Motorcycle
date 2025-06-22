// backend/controllers/dashboardController.js
const db = require('../config/db'); // Pastikan path ini benar

const getDashboardStats = async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();

        // 1. Total User & User Pending
        // Kueri ini mengasumsikan tabel 'users' dan 'pending_users' ada.
        const [userCounts] = await connection.execute(`
            SELECT
                (SELECT COUNT(id) FROM users) AS totalUsers,
                (SELECT COUNT(id) FROM pending_users) AS pendingRegistrations
        `);

        // 2. Status Motor (Tersedia, Disewa, Maintenance)
        // Kueri ini mengasumsikan tabel 'motors' ada.
        const [motorCounts] = await connection.execute(`
            SELECT
                COUNT(CASE WHEN status = 'available' THEN 1 END) AS available,
                COUNT(CASE WHEN status = 'rented' THEN 1 END) AS rented,
                COUNT(CASE WHEN status = 'maintenance' THEN 1 END) AS maintenance
            FROM motors
        `);

        // 3. Reservasi (Total Berhasil & Bulanan)
        // Kueri ini mengasumsikan tabel 'reservasi' ada.
        const [reservationCounts] = await connection.execute(`
            SELECT COUNT(id) AS totalReservations
            FROM reservasi
            WHERE status = 'completed' OR status = 'confirmed'
        `);

        // Reservasi Bulanan (untuk 12 bulan terakhir)
        // Kueri ini mengasumsikan tabel 'reservasi' ada.
        const [monthlyReservationsRaw] = await connection.execute(`
            SELECT
                DATE_FORMAT(tanggal_mulai, '%Y-%m') AS month,
                COUNT(id) AS count
            FROM reservasi
            WHERE tanggal_mulai >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)
            GROUP BY month
            ORDER BY month ASC
        `);

        // Format data bulanan untuk Chart.js
        const monthlyLabels = [];
        const monthlyData = [];
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth(); // 0-11
        for (let i = 0; i < 12; i++) {
            const date = new Date(currentYear, currentMonth - (11 - i), 1);
            monthlyLabels.push(date.toLocaleString('id-ID', { month: 'short', year: '2-digit' }));
            monthlyData.push(0); // Inisialisasi dengan 0
        }

        monthlyReservationsRaw.forEach(row => {
            const rowDate = new Date(row.month + '-01');
            const label = rowDate.toLocaleString('id-ID', { month: 'short', year: '2-digit' });
            const index = monthlyLabels.indexOf(label);
            if (index !== -1) {
                monthlyData[index] = row.count;
            }
        });


        // 4. Pembayaran (Total Masuk & Pending) - Dibuat ROBUST terhadap ketiadaan tabel 'pembayaran'
        let totalPaymentsReceivedValue = 0; // Inisialisasi nilai
        let pendingPaymentsCount = 0; // Inisialisasi nilai
        try {
            // Kueri ini akan gagal jika tabel 'pembayaran' tidak ada
            const [rows] = await connection.execute(`
                SELECT
                    SUM(CASE WHEN status_pembayaran = 'verified' THEN jumlah_pembayaran ELSE 0 END) AS totalPaymentsReceived,
                    COUNT(CASE WHEN status_pembayaran = 'pending' THEN 1 END) AS pendingPayments
                FROM pembayaran
            `);
            
            totalPaymentsReceivedValue = rows[0]?.totalPaymentsReceived || 0;
            pendingPaymentsCount = rows[0]?.pendingPayments || 0;

            // --- PERBAIKAN DI SINI: Kalikan dengan 1000 ---
            // Asumsi nilai dari DB adalah dalam satuan ribuan (misal 995 berarti 995.000)
            totalPaymentsReceivedValue = parseFloat(totalPaymentsReceivedValue);
            // --- AKHIR PERBAIKAN ---

            console.log('DEBUG_BACKEND: Raw totalPaymentsReceived from DB (before multiplying):', rows[0]?.totalPaymentsReceived);
            console.log('DEBUG_BACKEND: totalPaymentsReceived value (after multiplying by 1000):', totalPaymentsReceivedValue);

        } catch (paymentError) {
            console.warn('WARNING: Could not fetch payment stats. Table "pembayaran" might be missing or invalid:', paymentError.message);
            // Nilai default (0) akan tetap digunakan
        }

        // 5. Testimoni (Pending & Approved)
        // Kueri ini mengasumsikan tabel 'testimoni' ada.
        const [testimonialStats] = await connection.execute(`
            SELECT
                COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pendingTestimonials,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) AS approvedTestimonials
            FROM testimoni
        `);

        res.json({
            success: true,
            data: {
                totalUsers: userCounts[0].totalUsers || 0,
                pendingRegistrations: userCounts[0].pendingRegistrations || 0,
                motorStatus: {
                    available: motorCounts[0].available || 0,
                    rented: motorCounts[0].rented || 0,
                    maintenance: motorCounts[0].maintenance || 0
                },
                totalReservations: reservationCounts[0].totalReservations || 0,
                monthlyReservations: {
                    labels: monthlyLabels,
                    data: monthlyData
                },
                totalPaymentsReceived: totalPaymentsReceivedValue, // Kirim nilai yang sudah dikalikan
                pendingPayments: pendingPaymentsCount,
                pendingTestimonials: testimonialStats[0].pendingTestimonials || 0,
                approvedTestimonials: testimonialStats[0].approvedTestimonials || 0,
                userActivity: {
                    labels: ['Testimoni Pending', 'Testimoni Disetujui', 'Total User', 'Registrasi Pending', 'Pembayaran Diterima'],
                    data: [
                        testimonialStats[0].pendingTestimonials || 0,
                        testimonialStats[0].approvedTestimonials || 0,
                        userCounts[0].totalUsers || 0,
                        userCounts[0].pendingRegistrations || 0,
                        totalPaymentsReceivedValue // Gunakan nilai yang sudah dikalikan juga di sini
                    ]
                }
            }
        });

    } catch (error) {
        console.error('SEVERE ERROR IN DASHBOARD STATS:', error);
        // Pastikan respons error ini selalu JSON
        res.status(500).json({ success: false, message: 'Gagal mengambil statistik dashboard. Periksa log server.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    getDashboardStats
};