// frontend/src/pages/admin/PembayaranAdmin.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/admin/Sidebar.jsx';
import Footer from '../../components/Footer.jsx'; // Sesuaikan path jika berbeda

// CSS yang relevan (pastikan file-file ini ada dan berisi gaya yang dibutuhkan)
import '../../assets/css/admin/dashboard.css';
import '../../assets/css/admin/sidebar.css';
import '../../assets/css/admin/pembayaranadmin.css';
import '../../assets/css/global.css';

const PembayaranAdmin = () => {
    const [pembayaranList, setPembayaranList] = useState([]); // Hapus dummy data, inisialisasi kosong
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPembayaran, setSelectedPembayaran] = useState(null);
    const [detailPopupOpen, setDetailPopupOpen] = useState(false);
    const [confirmationPopupOpen, setConfirmationPopupOpen] = useState(false);
    const [actionType, setActionType] = useState(''); // 'approve' atau 'reject'
    const [rejectReason, setRejectReason] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const navigate = useNavigate();

    const getApiUrl = () => {
        return import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';
    };

    // === START: Fungsionalitas SIDEBAR (Disalin dari ReservasiAdmin.jsx) ===
    const [isSidebarToggled, setIsSidebarToggled] = useState(false);

    useEffect(() => {
        if (isSidebarToggled) {
            document.body.classList.add('sidebar-toggled');
        } else {
            document.body.classList.remove('sidebar-toggled');
        }
        const handleResize = () => {
            if (window.innerWidth < 768) setIsSidebarToggled(true);
            else setIsSidebarToggled(false);
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Panggil saat komponen dimuat
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [isSidebarToggled]);


    // === START: FUNGSI UNTUK MENGAMBIL DATA PEMBAYARAN DARI BACKEND ===
    const fetchPayments = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Sesi Anda berakhir, silakan login kembali.');
                navigate('/login');
                setLoading(false);
                return;
            }

            // Panggil API untuk mendapatkan semua pembayaran
            const response = await axios.get(`${getApiUrl()}/api/payments`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                timeout: 15000 // Timeout 15 detik
            });
            setPembayaranList(response.data.data);
        } catch (error) {
            console.error('Error fetching payments:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Terjadi kesalahan tidak dikenal.';
            alert(`Gagal memuat data pembayaran: ${errorMessage}. Pastikan Anda login sebagai admin.`);
            if (error.response?.status === 401 || error.response?.status === 403) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchPayments();
    }, [refreshTrigger, fetchPayments]); // refreshTrigger dan fetchPayments sebagai dependency
    // === END: FUNGSI UNTUK MENGAMBIL DATA PEMBAYARAN DARI BACKEND ===


    // Fungsi untuk memfilter data pembayaran di frontend
    const filteredPembayaran = pembayaranList.filter(item => {
        // Asumsi item.status_pembayaran dari backend akan selalu ada dan string
        const matchesStatus = filterStatus === 'all' || (item.status_pembayaran?.toLowerCase() === filterStatus.toLowerCase());
        // Asumsi item.user_nama_lengkap, item.motor_brand, item.motor_type, item.user_no_hp dari backend
        const matchesSearch = (item.user_nama_lengkap?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                             (item.motor_brand?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                             (item.motor_type?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                             (item.user_no_hp || '').includes(searchTerm);
        return matchesSearch && matchesStatus;
    });

    // Fungsi untuk mendapatkan badge status
    const getStatusBadge = (status) => {
        // Menggunakan toLowerCase() untuk memastikan case-insensitivity
        const lowerStatus = status?.toLowerCase();
        const badges = {
            pending: { text: 'Menunggu', class: 'status-pending', icon: '⏳' },
            verified: { text: 'Diverifikasi', class: 'status-verified', icon: '✅' }, // Mengubah ke 'verified'
            rejected: { text: 'Ditolak', class: 'status-rejected', icon: '❌' }
        };
        return badges[lowerStatus] || badges.pending;
    };

    // Fungsi untuk format currency
    const formatCurrency = (amount) => {
        // Memastikan input adalah angka dan menanganinya jika NaN
        const numAmount = parseFloat(amount);
        // Memformat menjadi Rupiah tanpa desimal
        return isNaN(numAmount) ? 'Rp 0' : `Rp ${numAmount.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    // Fungsi untuk format tanggal
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            // New Date() bisa menerima string tanggal ISO 8601 atau timestamp
            const date = new Date(dateString);
            // Cek apakah tanggal valid
            if (isNaN(date.getTime())) {
                throw new Error("Invalid Date");
            }
            return date.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            console.error("Invalid date string for formatDate:", dateString, e);
            // Kembalikan string asli atau placeholder jika tanggal tidak valid
            return dateString;
        }
    };

    // Fungsi untuk membuka detail pembayaran popup
    const openDetailPopup = (pembayaran) => {
        setSelectedPembayaran(pembayaran);
        setDetailPopupOpen(true);
        document.body.style.overflow = 'hidden'; // Nonaktifkan scroll body
    };

    // Fungsi untuk menutup detail pembayaran popup
    const closeDetailPopup = () => {
        setDetailPopupOpen(false);
        setSelectedPembayaran(null);
        document.body.style.overflow = 'auto'; // Aktifkan kembali scroll body
    };

    // Fungsi untuk membuka confirmation popup (approve/reject)
    const openConfirmationPopup = (pembayaran, action) => {
        setSelectedPembayaran(pembayaran);
        setActionType(action);
        setConfirmationPopupOpen(true);
        // Mengisi alasan penolakan dengan catatan admin yang sudah ada jika action adalah reject
        setRejectReason(pembayaran.admin_notes || '');
        document.body.style.overflow = 'hidden';
    };

    // Fungsi untuk menutup confirmation popup
    const closeConfirmationPopup = () => {
        setConfirmationPopupOpen(false);
        setSelectedPembayaran(null);
        setActionType('');
        setRejectReason('');
        document.body.style.overflow = 'auto';
    };

    // === FUNGSI UNTUK MENGUBAH STATUS PEMBAYARAN (REAL BACKEND CALL) ===
    const handleStatusChange = async () => {
        if (!selectedPembayaran) return;

        if (actionType === 'reject' && !rejectReason.trim()) {
            alert('Mohon berikan alasan penolakan!');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Sesi Anda berakhir, silakan login kembali.');
                navigate('/login');
                return;
            }

            // Status yang akan dikirim ke backend
            const newStatus = actionType === 'approve' ? 'verified' : 'rejected';
            // Catatan admin hanya relevan untuk penolakan
            const adminNotes = actionType === 'reject' ? rejectReason.trim() : null;

            // Panggil API PUT untuk mengubah status pembayaran
            const response = await axios.put(`${getApiUrl()}/api/payments/${selectedPembayaran.id}/status`,
                { status: newStatus, admin_notes: adminNotes }, // Kirim admin_notes ke backend
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert(response.data.message);
            closeConfirmationPopup();
            setRefreshTrigger(prev => prev + 1); // Memicu pengambilan ulang data
        } catch (error) {
            console.error('Error changing payment status:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Terjadi kesalahan tidak dikenal.';
            alert(`Gagal mengubah status pembayaran: ${errorMessage}.`);
        }
    };
    // === AKHIR FUNGSI MENGUBAH STATUS PEMBAYARAN ===


    // Fungsi untuk menghubungi customer via WhatsApp
    const contactCustomer = (pembayaran) => {
        // Menggunakan properti dari objek pembayaran yang diterima dari backend
        const message = encodeURIComponent(
            `Halo ${pembayaran.user_nama_lengkap}, kami menghubungi Anda terkait pembayaran rental motor ${pembayaran.motor_brand} ${pembayaran.motor_type} pada tanggal ${formatDate(pembayaran.reservasi_tanggal_mulai)}. Total pembayaran Anda: ${formatCurrency(pembayaran.jumlah_pembayaran)}. Terima kasih.`
        );
        const waUrl = `https://wa.me/${pembayaran.user_no_hp}?text=${message}`;
        window.open(waUrl, '_blank');
    };

    // Fungsi untuk download bukti pembayaran
    const downloadBukti = (filePath) => {
        if (!filePath) {
            alert('Jalur file bukti pembayaran tidak tersedia.');
            return;
        }
        // Asumsi filePath dari backend adalah 'uploads\pembayaran\nama_file.jpg' atau 'uploads/pembayaran/nama_file.jpg'
        // Kita perlu mendapatkan hanya nama file dari path lengkap
        const fileName = filePath.split(/[\\/]/).pop(); // Memisahkan berdasarkan '/' atau '\'
        const fileUrl = `${getApiUrl()}/uploads/pembayaran/${fileName}`; // Path yang dapat diakses publik di server

        window.open(fileUrl, '_blank'); // Buka di tab baru
    };

    // JSX untuk tampilan loading
    if (loading) {
        return (
            <div id="wrapper" className={isSidebarToggled ? 'sidebar-toggled' : ''}>
                <Sidebar />
                <div id="content-wrapper" className="d-flex flex-column">
                    <div id="content">
                        <div className="loading-container">
                            <div className="loading-spinner">⏳</div>
                            <p>Memuat data pembayaran...</p>
                        </div>
                    </div>
                    {/* Footer juga di sini untuk tampilan loading */}
                    <Footer />
                </div>
            </div>
        );
    }

    // JSX untuk tampilan utama setelah loading
    return (
        <div id="wrapper" className={isSidebarToggled ? 'sidebar-toggled' : ''}>
            <Sidebar />

            <div id="content-wrapper" className="d-flex flex-column">
                <div id="content">
                    <div className="container-fluid">
                        <div className="pembayaran-wrapper">

                            {/* Header Admin */}
                            <div className="page-header">
                                <div className="header-icon">👤</div>
                                <h1 className="page-title">Admin - Kelola Pembayaran</h1>
                                <p className="page-subtitle">Verifikasi dan kelola pembayaran dari pelanggan</p>
                            </div>

                            {/* Filter dan Search */}
                            <div className="card shadow mb-4">
                                <div className="card-body">
                                    <div className="admin-controls">
                                        <div className="search-group">
                                            <input
                                                type="text"
                                                placeholder="Cari nama, motor, atau nomor HP..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="form-control"
                                            />
                                        </div>
                                        <div className="filter-group">
                                            <select
                                                value={filterStatus}
                                                onChange={(e) => setFilterStatus(e.target.value)}
                                                className="form-select"
                                            >
                                                <option value="all">Semua Status</option>
                                                <option value="pending">Menunggu</option>
                                                <option value="verified">Diverifikasi</option>
                                                <option value="rejected">Ditolak</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Statistik */}
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon">⏳</div>
                                    <div className="stat-info">
                                        <div className="stat-number">{pembayaranList.filter(p => p.status_pembayaran === 'pending').length}</div>
                                        <div className="stat-label">Menunggu</div>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">✅</div>
                                    <div className="stat-info">
                                        <div className="stat-number">{pembayaranList.filter(p => p.status_pembayaran === 'verified').length}</div>
                                        <div className="stat-label">Diverifikasi</div>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">❌</div>
                                    <div className="stat-info">
                                        <div className="stat-number">{pembayaranList.filter(p => p.status_pembayaran === 'rejected').length}</div>
                                        <div className="stat-label">Ditolak</div>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">💰</div>
                                    <div className="stat-info">
                                        <div className="stat-number">
                                            {formatCurrency(pembayaranList.filter(p => p.status_pembayaran === 'verified').reduce((sum, p) => sum + parseFloat(p.jumlah_pembayaran), 0))}
                                        </div>
                                        <div className="stat-label">Total Diterima</div>
                                    </div>
                                </div>
                            </div>

                            {/* Tabel Pembayaran */}
                            <div className="card shadow mb-4">
                                <div className="card-header py-3">
                                    <h6 className="m-0 font-weight-bold text-primary">Daftar Pembayaran</h6>
                                    <div className="card-subtitle">
                                        Menampilkan {filteredPembayaran.length} dari {pembayaranList.length} pembayaran
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-bordered" width="100%" cellSpacing="0">
                                            <thead>
                                                <tr>
                                                    <th>Customer</th>
                                                    <th>Motor</th>
                                                    <th>Tanggal Sewa</th>
                                                    <th>Total</th>
                                                    <th>Status</th>
                                                    <th>Upload</th>
                                                    <th>Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredPembayaran.length > 0 ? (
                                                    filteredPembayaran.map(pembayaran => {
                                                        const statusBadge = getStatusBadge(pembayaran.status_pembayaran);
                                                        return (
                                                            <tr key={pembayaran.id}>
                                                                <td>
                                                                    <div className="customer-info">
                                                                        <div className="customer-name">{pembayaran.user_nama_lengkap}</div>
                                                                        <div className="customer-phone">{pembayaran.user_no_hp}</div>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div className="motor-info">
                                                                        <div className="motor-name">{pembayaran.motor_brand} {pembayaran.motor_type}</div>
                                                                        <div className="motor-duration">{pembayaran.reservasi_lama_sewa} hari</div>
                                                                    </div>
                                                                </td>
                                                                <td>{formatDate(pembayaran.reservasi_tanggal_mulai)}</td>
                                                                <td className="amount">{formatCurrency(pembayaran.jumlah_pembayaran)}</td>
                                                                <td>
                                                                    <span className={`badge ${statusBadge.class}`}>
                                                                        {statusBadge.icon} {statusBadge.text}
                                                                    </span>
                                                                </td>
                                                                <td>{formatDate(pembayaran.tanggal_pembayaran)}</td>
                                                                <td>
                                                                    <div className="d-flex flex-column">
                                                                        <button
                                                                            onClick={() => openDetailPopup(pembayaran)}
                                                                            className="btn btn-info btn-sm mb-1"
                                                                            title="Lihat Detail"
                                                                        >
                                                                            👁️ Detail
                                                                        </button>
                                                                        {pembayaran.status_pembayaran === 'pending' && (
                                                                            <>
                                                                                <button
                                                                                    onClick={() => openConfirmationPopup(pembayaran, 'approve')}
                                                                                    className="btn btn-success btn-sm mb-1"
                                                                                    title="Setujui"
                                                                                >
                                                                                    ✅ Setujui
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => openConfirmationPopup(pembayaran, 'reject')}
                                                                                    className="btn btn-danger btn-sm mb-1"
                                                                                    title="Tolak"
                                                                                >
                                                                                    ❌ Tolak
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                        <button
                                                                            onClick={() => contactCustomer(pembayaran)}
                                                                            className="btn btn-warning btn-sm"
                                                                            title="Hubungi via WhatsApp"
                                                                        >
                                                                            💬 Hubungi
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan="7" className="text-center">
                                                            {loading ? 'Memuat data...' : 'Tidak ada data pembayaran.'}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {filteredPembayaran.length === 0 && !loading && (
                                        <div className="empty-state">
                                            <div className="empty-icon">📭</div>
                                            <h3>Tidak ada data pembayaran</h3>
                                            <p>Belum ada pembayaran yang sesuai dengan filter yang dipilih.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Admin */}
                <footer className="sticky-footer bg-white">
                    <div className="container my-auto">
                        <div className="copyright text-center my-auto">
                            <span>Copyright &copy; Motor Rental 2024</span>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Detail Popup */}
            {detailPopupOpen && selectedPembayaran && (
                <div className="popup-overlay active">
                    <div className="popup-content large">
                        <div className="popup-header">
                            <h3>Detail Pembayaran - {selectedPembayaran.user_nama_lengkap}</h3>
                            <button className="close-btn" onClick={closeDetailPopup}>&times;</button>
                        </div>
                        <div className="popup-body">
                            <div className="detail-grid">
                                <div className="detail-section">
                                    <h4>📋 Informasi Reservasi</h4>
                                    <div className="detail-item">
                                        <label>ID Reservasi:</label>
                                        <span>{selectedPembayaran.reservasi_id}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Nama Lengkap:</label>
                                        <span>{selectedPembayaran.user_nama_lengkap}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>No. HP:</label>
                                        <span>{selectedPembayaran.user_no_hp}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Motor:</label>
                                        <span>{selectedPembayaran.motor_brand} {selectedPembayaran.motor_type}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Tanggal Sewa:</label>
                                        <span>{formatDate(selectedPembayaran.reservasi_tanggal_mulai)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Lama Sewa:</label>
                                        <span>{selectedPembayaran.reservasi_lama_sewa} hari</span> {/* <-- Perbaikan di sini */}
                                    </div>
                                    <div className="detail-item">
                                        <label>Total Reservasi:</label>
                                        <span className="amount">{formatCurrency(selectedPembayaran.reservasi_total_harga)}</span>
                                    </div>
                                </div>
                                
                                <div className="detail-section">
                                    <h4>💳 Informasi Pembayaran</h4>
                                    <div className="detail-item">
                                        <label>ID Pembayaran:</label>
                                        <span>{selectedPembayaran.id}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Jumlah Pembayaran:</label>
                                        <span className="amount">{formatCurrency(selectedPembayaran.jumlah_pembayaran)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Status Pembayaran:</label>
                                        <span className={`badge ${getStatusBadge(selectedPembayaran.status_pembayaran).class}`}>
                                            {getStatusBadge(selectedPembayaran.status_pembayaran).icon} {getStatusBadge(selectedPembayaran.status_pembayaran).text}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Tanggal Pembayaran:</label>
                                        <span>{formatDate(selectedPembayaran.tanggal_pembayaran)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Metode Pembayaran:</label>
                                        <span>{selectedPembayaran.metode_pembayaran}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Bukti Pembayaran:</label>
                                        <div className="bukti-actions">
                                            <span>{selectedPembayaran.bukti_transfer.split('/').pop() || 'N/A'}</span>
                                            <button 
                                                onClick={() => downloadBukti(selectedPembayaran.bukti_transfer)}
                                                className="btn-download"
                                            >
                                                📥 Download
                                            </button>
                                        </div>
                                    </div>
                                    {selectedPembayaran.catatan_pembeli && (
                                        <div className="detail-item">
                                            <label>Catatan Pembeli:</label>
                                            <span>{selectedPembayaran.catatan_pembeli}</span>
                                        </div>
                                    )}
                                    {selectedPembayaran.admin_notes && (
                                        <div className="detail-item">
                                            <label>Catatan Admin:</label>
                                            <span>{selectedPembayaran.admin_notes}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="popup-footer">
                            <button className="btn btn-secondary" onClick={closeDetailPopup}>
                                Tutup
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={() => contactCustomer(selectedPembayaran)}
                            >
                                💬 Hubungi Customer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Popup */}
            {confirmationPopupOpen && selectedPembayaran && (
                <div className="popup-overlay active">
                    <div className="popup-content">
                        <div className="popup-header">
                            <h3>
                                {actionType === 'approve' ? '✅ Setujui Pembayaran' : '❌ Tolak Pembayaran'}
                            </h3>
                            <button className="close-btn" onClick={closeConfirmationPopup}>&times;</button>
                        </div>
                        <div className="popup-body">
                            <div className="confirmation-content">
                                <p>
                                    Apakah Anda yakin ingin {actionType === 'approve' ? 'menyetujui' : 'menolak'} pembayaran dari:
                                </p>
                                <div className="customer-summary">
                                    <strong>{selectedPembayaran.user_nama_lengkap}</strong><br/>
                                    {selectedPembayaran.motor_brand} {selectedPembayaran.motor_type}<br/>
                                    {formatCurrency(selectedPembayaran.jumlah_pembayaran)}
                                </div>
                                
                                {actionType === 'reject' && (
                                    <div className="form-group">
                                        <label>Alasan Penolakan:</label>
                                        <textarea
                                            value={rejectReason}
                                            onChange={(e) => setRejectReason(e.target.value)}
                                            placeholder="Masukkan alasan penolakan..."
                                            rows="3"
                                            className="form-control"
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="popup-footer">
                            <button className="btn btn-secondary" onClick={closeConfirmationPopup}>
                                Batal
                            </button>
                            <button 
                                className={`btn ${actionType === 'approve' ? 'btn-success' : 'btn-danger'}`}
                                onClick={handleStatusChange}
                            >
                                {actionType === 'approve' ? '✅ Setujui' : '❌ Tolak'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PembayaranAdmin;
