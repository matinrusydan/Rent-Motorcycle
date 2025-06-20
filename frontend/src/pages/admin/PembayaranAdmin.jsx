// frontend/src/pages/admin/PembayaranAdmin.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header.jsx';
import Footer from '../../components/Footer.jsx';
import '../../assets/css/pembayaran.css'; // Menggunakan CSS pembayaran untuk styling utama
import '../../assets/css/admin/dashboard.css'; // Atau CSS admin umum jika ada
import '../../assets/css/global.css'; 

const PembayaranAdmin = () => {
    // State untuk data pembayaran (dummy data untuk simulasi)
    const [pembayaranList, setPembayaranList] = useState([
        {
            id: 1,
            nama: 'Budi Santoso',
            motor: 'Honda Beat',
            tanggalSewa: '2025-06-21',
            lamaSewa: 3,
            totalPembayaran: 240000,
            statusPembayaran: 'pending',
            buktiPembayaran: 'bukti_1.jpg',
            tanggalUpload: '2025-06-20 14:30',
            catatan: 'Sudah transfer via BCA',
            noHp: '081234567890'
        },
        {
            id: 2,
            nama: 'Sari Melati',
            motor: 'Yamaha NMAX',
            tanggalSewa: '2025-06-22',
            lamaSewa: 2,
            totalPembayaran: 220000,
            statusPembayaran: 'approved',
            buktiPembayaran: 'bukti_2.jpg',
            tanggalUpload: '2025-06-19 16:45',
            catatan: '',
            noHp: '085678901234'
        },
        {
            id: 3,
            nama: 'Ahmad Rizki',
            motor: 'Honda PCX',
            tanggalSewa: '2025-06-23',
            lamaSewa: 1,
            totalPembayaran: 120000,
            statusPembayaran: 'rejected',
            buktiPembayaran: 'bukti_3.jpg',
            tanggalUpload: '2025-06-20 09:15',
            catatan: 'Bukti tidak jelas',
            noHp: '087654321098'
        },
        {
            id: 4,
            nama: 'Rina Handayani',
            motor: 'Suzuki Address',
            tanggalSewa: '2025-06-24',
            lamaSewa: 5,
            totalPembayaran: 425000,
            statusPembayaran: 'pending',
            buktiPembayaran: 'bukti_4.pdf',
            tanggalUpload: '2025-06-20 11:20',
            catatan: 'Transfer dari rekening berbeda',
            noHp: '089876543210'
        }
    ]);

    // State untuk filter dan pencarian
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPembayaran, setSelectedPembayaran] = useState(null);
    const [detailPopupOpen, setDetailPopupOpen] = useState(false);
    const [confirmationPopupOpen, setConfirmationPopupOpen] = useState(false);
    const [actionType, setActionType] = useState(''); // 'approve' atau 'reject'
    const [rejectReason, setRejectReason] = useState('');

    // Fungsi untuk memfilter data pembayaran
    const filteredPembayaran = pembayaranList.filter(item => {
        const matchesStatus = filterStatus === 'all' || item.statusPembayaran === filterStatus;
        const matchesSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             item.motor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             item.noHp.includes(searchTerm);
        return matchesStatus && matchesSearch;
    });

    // Fungsi untuk mendapatkan badge status
    const getStatusBadge = (status) => {
        const badges = {
            pending: { text: 'Menunggu', class: 'status-pending', icon: '⏳' },
            approved: { text: 'Disetujui', class: 'status-approved', icon: '✅' },
            rejected: { text: 'Ditolak', class: 'status-rejected', icon: '❌' }
        };
        return badges[status] || badges.pending;
    };

    // Fungsi untuk format currency
    const formatCurrency = (amount) => {
        return `Rp ${amount.toLocaleString('id-ID')}`;
    };

    // Fungsi untuk format tanggal
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    // Fungsi untuk membuka detail pembayaran
    const openDetailPopup = (pembayaran) => {
        setSelectedPembayaran(pembayaran);
        setDetailPopupOpen(true);
        document.body.style.overflow = 'hidden';
    };

    // Fungsi untuk menutup detail popup
    const closeDetailPopup = () => {
        setDetailPopupOpen(false);
        setSelectedPembayaran(null);
        document.body.style.overflow = 'auto';
    };

    // Fungsi untuk membuka confirmation popup
    const openConfirmationPopup = (pembayaran, action) => {
        setSelectedPembayaran(pembayaran);
        setActionType(action);
        setConfirmationPopupOpen(true);
        setRejectReason('');
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

    // Fungsi untuk menghandle approval/rejection
    const handleStatusChange = () => {
        if (!selectedPembayaran) return;

        if (actionType === 'reject' && !rejectReason.trim()) {
            alert('Mohon berikan alasan penolakan!');
            return;
        }

        // Update status pembayaran
        const updatedList = pembayaranList.map(item => {
            if (item.id === selectedPembayaran.id) {
                return {
                    ...item,
                    statusPembayaran: actionType === 'approve' ? 'approved' : 'rejected',
                    catatan: actionType === 'reject' ? rejectReason : item.catatan
                };
            }
            return item;
        });

        setPembayaranList(updatedList);
        
        // Simulasi kirim notifikasi ke customer
        const statusText = actionType === 'approve' ? 'disetujui' : 'ditolak';
        alert(`Pembayaran ${selectedPembayaran.nama} berhasil ${statusText}!`);
        
        closeConfirmationPopup();
    };

    // Fungsi untuk menghubungi customer via WhatsApp
    const contactCustomer = (pembayaran) => {
        const message = encodeURIComponent(
            `Halo ${pembayaran.nama}, kami menghubungi Anda terkait pembayaran rental motor ${pembayaran.motor} pada tanggal ${formatDate(pembayaran.tanggalSewa)}. Terima kasih.`
        );
        const waUrl = `https://wa.me/${pembayaran.noHp}?text=${message}`;
        window.open(waUrl, '_blank');
    };

    // Fungsi untuk download bukti pembayaran (simulasi)
    const downloadBukti = (fileName) => {
        // Simulasi download - di aplikasi nyata akan fetch file dari server
        alert(`Downloading: ${fileName}`);
    };

    return (
        <>
            <Header />

            {/* Main Content */}
            <main className="main-content">
                <div className="container">
                    <div className="pembayaran-wrapper">
                        
                        {/* Header Admin */}
                        <div className="page-header">
                            <div className="header-icon">👤</div>
                            <h1 className="page-title">Admin - Kelola Pembayaran</h1>
                            <p className="page-subtitle">Verifikasi dan kelola pembayaran dari pelanggan</p>
                        </div>

                        {/* Filter dan Search */}
                        <div className="card">
                            <div className="card-content">
                                <div className="admin-controls">
                                    <div className="search-group">
                                        <input
                                            type="text"
                                            placeholder="Cari nama, motor, atau nomor HP..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="search-input"
                                        />
                                    </div>
                                    <div className="filter-group">
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="filter-select"
                                        >
                                            <option value="all">Semua Status</option>
                                            <option value="pending">Menunggu</option>
                                            <option value="approved">Disetujui</option>
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
                                    <div className="stat-number">{pembayaranList.filter(p => p.statusPembayaran === 'pending').length}</div>
                                    <div className="stat-label">Menunggu</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">✅</div>
                                <div className="stat-info">
                                    <div className="stat-number">{pembayaranList.filter(p => p.statusPembayaran === 'approved').length}</div>
                                    <div className="stat-label">Disetujui</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">❌</div>
                                <div className="stat-info">
                                    <div className="stat-number">{pembayaranList.filter(p => p.statusPembayaran === 'rejected').length}</div>
                                    <div className="stat-label">Ditolak</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">💰</div>
                                <div className="stat-info">
                                    <div className="stat-number">
                                        {formatCurrency(pembayaranList.filter(p => p.statusPembayaran === 'approved').reduce((sum, p) => sum + p.totalPembayaran, 0))}
                                    </div>
                                    <div className="stat-label">Total Diterima</div>
                                </div>
                            </div>
                        </div>

                        {/* Tabel Pembayaran */}
                        <div className="card">
                            <div className="card-header">
                                <h2 className="card-title">📋 Daftar Pembayaran</h2>
                                <div className="card-subtitle">
                                    Menampilkan {filteredPembayaran.length} dari {pembayaranList.length} pembayaran
                                </div>
                            </div>
                            <div className="card-content">
                                <div className="table-responsive">
                                    <table className="pembayaran-table">
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
                                            {filteredPembayaran.map(pembayaran => {
                                                const statusBadge = getStatusBadge(pembayaran.statusPembayaran);
                                                return (
                                                    <tr key={pembayaran.id}>
                                                        <td>
                                                            <div className="customer-info">
                                                                <div className="customer-name">{pembayaran.nama}</div>
                                                                <div className="customer-phone">{pembayaran.noHp}</div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="motor-info">
                                                                <div className="motor-name">{pembayaran.motor}</div>
                                                                <div className="motor-duration">{pembayaran.lamaSewa} hari</div>
                                                            </div>
                                                        </td>
                                                        <td>{formatDate(pembayaran.tanggalSewa)}</td>
                                                        <td className="amount">{formatCurrency(pembayaran.totalPembayaran)}</td>
                                                        <td>
                                                            <span className={`status-badge ${statusBadge.class}`}>
                                                                {statusBadge.icon} {statusBadge.text}
                                                            </span>
                                                        </td>
                                                        <td>{pembayaran.tanggalUpload}</td>
                                                        <td>
                                                            <div className="action-buttons">
                                                                <button
                                                                    onClick={() => openDetailPopup(pembayaran)}
                                                                    className="btn-action btn-detail"
                                                                    title="Lihat Detail"
                                                                >
                                                                    👁️
                                                                </button>
                                                                {pembayaran.statusPembayaran === 'pending' && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => openConfirmationPopup(pembayaran, 'approve')}
                                                                            className="btn-action btn-approve"
                                                                            title="Setujui"
                                                                        >
                                                                            ✅
                                                                        </button>
                                                                        <button
                                                                            onClick={() => openConfirmationPopup(pembayaran, 'reject')}
                                                                            className="btn-action btn-reject"
                                                                            title="Tolak"
                                                                        >
                                                                            ❌
                                                                        </button>
                                                                    </>
                                                                )}
                                                                <button
                                                                    onClick={() => contactCustomer(pembayaran)}
                                                                    className="btn-action btn-contact"
                                                                    title="Hubungi via WhatsApp"
                                                                >
                                                                    💬
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                
                                {filteredPembayaran.length === 0 && (
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
            </main>

            <Footer />

            {/* Detail Popup */}
            {detailPopupOpen && selectedPembayaran && (
                <div className="popup-overlay active">
                    <div className="popup-content large">
                        <div className="popup-header">
                            <h3>Detail Pembayaran - {selectedPembayaran.nama}</h3>
                            <button className="close-btn" onClick={closeDetailPopup}>&times;</button>
                        </div>
                        <div className="popup-body">
                            <div className="detail-grid">
                                <div className="detail-section">
                                    <h4>📋 Informasi Reservasi</h4>
                                    <div className="detail-item">
                                        <label>Nama Lengkap:</label>
                                        <span>{selectedPembayaran.nama}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>No. HP:</label>
                                        <span>{selectedPembayaran.noHp}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Motor:</label>
                                        <span>{selectedPembayaran.motor}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Tanggal Sewa:</label>
                                        <span>{formatDate(selectedPembayaran.tanggalSewa)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Lama Sewa:</label>
                                        <span>{selectedPembayaran.lamaSewa} hari</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Total Pembayaran:</label>
                                        <span className="amount">{formatCurrency(selectedPembayaran.totalPembayaran)}</span>
                                    </div>
                                </div>
                                
                                <div className="detail-section">
                                    <h4>💳 Informasi Pembayaran</h4>
                                    <div className="detail-item">
                                        <label>Status:</label>
                                        <span className={`status-badge ${getStatusBadge(selectedPembayaran.statusPembayaran).class}`}>
                                            {getStatusBadge(selectedPembayaran.statusPembayaran).icon} {getStatusBadge(selectedPembayaran.statusPembayaran).text}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Tanggal Upload:</label>
                                        <span>{selectedPembayaran.tanggalUpload}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Bukti Pembayaran:</label>
                                        <div className="bukti-actions">
                                            <span>{selectedPembayaran.buktiPembayaran}</span>
                                            <button 
                                                onClick={() => downloadBukti(selectedPembayaran.buktiPembayaran)}
                                                className="btn-download"
                                            >
                                                📥 Download
                                            </button>
                                        </div>
                                    </div>
                                    {selectedPembayaran.catatan && (
                                        <div className="detail-item">
                                            <label>Catatan:</label>
                                            <span>{selectedPembayaran.catatan}</span>
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
                                    <strong>{selectedPembayaran.nama}</strong><br/>
                                    {selectedPembayaran.motor}<br/>
                                    {formatCurrency(selectedPembayaran.totalPembayaran)}
                                </div>
                                
                                {actionType === 'reject' && (
                                    <div className="form-group">
                                        <label>Alasan Penolakan:</label>
                                        <textarea
                                            value={rejectReason}
                                            onChange={(e) => setRejectReason(e.target.value)}
                                            placeholder="Masukkan alasan penolakan..."
                                            rows="3"
                                            className="form-textarea"
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

            <style jsx>{`
                .admin-controls {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .search-group {
                    flex: 1;
                    min-width: 250px;
                }

                .search-input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border: 2px solid var(--gray-300);
                    border-radius: 8px;
                    font-size: 1rem;
                }

                .filter-group {
                    min-width: 150px;
                }

                .filter-select {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border: 2px solid var(--gray-300);
                    border-radius: 8px;
                    font-size: 1rem;
                    background: white;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .stat-card {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .stat-icon {
                    font-size: 2rem;
                    background: var(--primary-light);
                    padding: 0.5rem;
                    border-radius: 8px;
                }

                .stat-number {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: var(--primary-color);
                }

                .stat-label {
                    color: var(--gray-600);
                    font-size: 0.9rem;
                }

                .table-responsive {
                    overflow-x: auto;
                }

                .pembayaran-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 1rem;
                }

                .pembayaran-table th,
                .pembayaran-table td {
                    padding: 1rem;
                    text-align: left;
                    border-bottom: 1px solid var(--gray-200);
                }

                .pembayaran-table th {
                    background: var(--gray-50);
                    font-weight: 600;
                    color: var(--gray-700);
                }

                .customer-info, .motor-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .customer-name, .motor-name {
                    font-weight: 600;
                }

                .customer-phone, .motor-duration {
                    font-size: 0.9rem;
                    color: var(--gray-600);
                }

                .amount {
                    font-weight: 600;
                    color: var(--success-color);
                }

                .status-badge {
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .status-pending {
                    background: #fff3cd;
                    color: #856404;
                }

                .status-approved {
                    background: #d1edff;
                    color: #0c5460;
                }

                .status-rejected {
                    background: #f8d7da;
                    color: #721c24;
                }

                .action-buttons {
                    display: flex;
                    gap: 0.5rem;
                }

                .btn-action {
                    padding: 0.5rem;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                }

                .btn-detail {
                    background: var(--gray-100);
                    color: var(--gray-700);
                }

                .btn-approve {
                    background: #d1edff;
                    color: #0c5460;
                }

                .btn-reject {
                    background: #f8d7da;
                    color: #721c24;
                }

                .btn-contact {
                    background: #d4edda;
                    color: #155724;
                }

                .btn-action:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }

                .empty-state {
                    text-align: center;
                    padding: 3rem;
                    color: var(--gray-600);
                }

                .empty-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                }

                .popup-content.large {
                    max-width: 800px;
                    width: 90vw;
                }

                .detail-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                }

                .detail-section h4 {
                    margin-bottom: 1rem;
                    color: var(--primary-color);
                    border-bottom: 2px solid var(--primary-light);
                    padding-bottom: 0.5rem;
                }

                .detail-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem 0;
                    border-bottom: 1px solid var(--gray-100);
                }

                .detail-item label {
                    font-weight: 600;
                    color: var(--gray-700);
                    flex-shrink: 0;
                    margin-right: 1rem;
                }

                .bukti-actions {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .btn-download {
                    padding: 0.5rem 1rem;
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9rem;
                }

                .confirmation-content p {
                    margin-bottom: 1rem;
                }

                .customer-summary {
                    background: var(--gray-50);
                    padding: 1rem;
                    border-radius: 8px;
                    margin: 1rem 0;
                    text-align: center;
                }

                .btn-success {
                    background: var(--success-color);
                    color: white;
                }

                .btn-danger {
                    background: var(--danger-color);
                    color: white;
                }

                @media (max-width: 768px) {
                    .detail-grid {
                        grid-template-columns: 1fr;
                        gap: 1rem;
                    }
                    
                    .admin-controls {
                        flex-direction: column;
                    }
                    
                    .search-group, .filter-group {
                        width: 100%;
                        min-width: auto;
                    }

                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            `}</style>
        </>
    );
};

export default PembayaranAdmin;