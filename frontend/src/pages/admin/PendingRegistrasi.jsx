// frontend/src/pages/admin/PendingRegistrasi.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Tambahkan useNavigate
import axios from 'axios'; // Impor axios
import Sidebar from '../../components/admin/Sidebar.jsx'; // Impor komponen Sidebar

// CSS yang relevan
import '../../assets/css/admin/dashboard.css'; // Untuk gaya admin umum (cards, topbar, modals)
import '../../assets/css/admin/sidebar.css';   // Untuk gaya sidebar
import '../../assets/css/admin/pendingregistrasi.css'; // Gaya khusus halaman ini
import '../../assets/css/global.css';

const PendingRegistrasi = () => {
    const [registrasiData, setRegistrasiData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // Filter ini akan selalu 'pending' jika data dari pending_users
    const [selectedIds, setSelectedIds] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0); // Untuk memicu refresh data

    const navigate = useNavigate(); // Inisialisasi useNavigate

    // Get API URL (copy from Login.jsx/Register.jsx)
    const getApiUrl = () => {
        return import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';
    };

    // Fungsi untuk mengambil data registrasi pending dari backend
    const fetchPendingRegistrations = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token'); // Ambil token dari localStorage
            if (!token) {
                alert('Sesi Anda berakhir, silakan login kembali.');
                navigate('/login'); // Redirect ke login jika tidak ada token
                setLoading(false);
                return;
            }

            const response = await axios.get(`${getApiUrl()}/api/auth/admin/pending-users`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            // Data dari backend adalah pengguna pending, jadi statusnya secara implisit adalah 'pending'
            setRegistrasiData(response.data.data.map(item => ({ ...item, status: 'pending' }))); 
        } catch (error) {
            console.error('Error fetching pending registrations:', error);
            alert(`Gagal memuat data registrasi: ${error.response?.data?.message || error.message}. Pastikan Anda login sebagai admin.`);
            if (error.response?.status === 401 || error.response?.status === 403) {
                navigate('/login'); // Redirect jika token tidak valid atau tidak ada izin
            }
        } finally {
            setLoading(false);
        }
    };

    // Efek untuk memuat data saat komponen di-mount atau refreshTrigger berubah
    useEffect(() => {
        fetchPendingRegistrations();
    }, [refreshTrigger, navigate]); // refreshTrigger dan navigate sebagai dependensi

    // Filter data berdasarkan search dan status
    const filteredData = registrasiData.filter(item => {
        const matchesSearch = item.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) || 
                               item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               item.no_hp.includes(searchTerm); 
        // Status di sini akan selalu 'pending' karena ini hanya data dari pending_users
        // Filter statusFilter akan diterapkan pada data dummy jika tidak ada status di backend
        const matchesStatus = statusFilter === 'all' || item.status === statusFilter; 
        return matchesSearch && matchesStatus;
    });

    const handleCheckboxChange = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) 
                ? prev.filter(selectedId => selectedId !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === filteredData.length && filteredData.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredData.map(item => item.id));
        }
    };

    const openModal = (data) => {
        setModalData(data);
        setShowModal(true);
        document.body.style.overflow = 'hidden'; 
    };

    const closeModal = () => {
        setShowModal(false);
        setModalData(null);
        document.body.style.overflow = 'auto'; 
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            let responseMessage = '';
            
            if (!confirm(`Apakah Anda yakin ingin ${newStatus === 'approved' ? 'menyetujui' : 'menolak'} user ini?`)) {
                return;
            }

            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            if (newStatus === 'approved') {
                const response = await axios.post(`${getApiUrl()}/api/auth/admin/approve-user/${id}`, {}, config);
                responseMessage = response.data.message || 'User berhasil disetujui!';
            } else { // newStatus === 'rejected'
                const response = await axios.delete(`${getApiUrl()}/api/auth/admin/reject-user/${id}`, config);
                responseMessage = response.data.message || 'User berhasil ditolak!';
            }
            
            alert(responseMessage);
            setRefreshTrigger(prev => prev + 1); // Memicu refresh data
            closeModal(); // Tutup modal setelah aksi
        } catch (error) {
            console.error('Error changing user status:', error);
            alert(`Gagal mengubah status user: ${error.response?.data?.message || error.message}. Pastikan Anda memiliki izin admin.`);
        }
    };

    const handleBulkAction = async (action) => {
        if (selectedIds.length === 0) {
            alert('Pilih minimal satu item untuk melakukan aksi bulk!');
            return;
        }

        if (!confirm(`Apakah Anda yakin ingin ${action === 'approved' ? 'menyetujui' : 'menolak'} ${selectedIds.length} item yang dipilih?`)) {
            return;
        }

        setLoading(true);
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        let successCount = 0;
        let failCount = 0;

        for (const id of selectedIds) {
            try {
                if (action === 'approved') {
                    await axios.post(`${getApiUrl()}/api/auth/admin/approve-user/${id}`, {}, config);
                } else { // action === 'rejected'
                    await axios.delete(`${getApiUrl()}/api/auth/admin/reject-user/${id}`, config);
                }
                successCount++;
            } catch (error) {
                console.error(`Gagal ${action} user ID ${id}:`, error);
                failCount++;
            }
        }

        setLoading(false);
        alert(`${successCount} item berhasil di${action}. ${failCount} item gagal.`);
        setSelectedIds([]);
        setRefreshTrigger(prev => prev + 1); // Memicu refresh data
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { class: 'status-pending', text: 'Menunggu', icon: '⏳' },
            approved: { class: 'status-approved', text: 'Disetujui', icon: '✅' },
            rejected: { class: 'status-rejected', text: 'Ditolak', icon: '❌' }
        };
        const config = statusConfig[status] || statusConfig.pending;
        return (
            <span className={`status-badge ${config.class}`}>
                {config.icon} {config.text}
            </span>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const viewDocument = (documentPath) => {
        if (documentPath) {
            window.open(`${getApiUrl()}/${documentPath}`, '_blank'); // Menampilkan dokumen dari server
        } else {
            alert('Dokumen tidak tersedia.');
        }
    };

    // Ini adalah struktur layout Admin yang sama dengan DashboardAdmin.jsx
    return (
        <div id="wrapper">
            <Sidebar /> {/* Komponen Sidebar */}
            <div id="content-wrapper" className="d-flex flex-column">
                <div id="content">
                    {/* Topbar (copy dari DashboardAdmin.jsx) */}
                    <nav className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow">
                        <ul className="navbar-nav ml-auto">
                            <li className="nav-item dropdown no-arrow">
                                <a className="nav-link dropdown-toggle" href="#" id="userDropdown" role="button"
                                    data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    <span className="mr-2 d-none d-lg-inline text-gray-600 small">Admin</span>
                                    <img className="img-profile rounded-circle"
                                        src="http://via.placeholder.com/40x40" alt="Profile" />
                                </a>
                                <div className="dropdown-menu dropdown-menu-right shadow animated--grow-in"
                                    aria-labelledby="userDropdown">
                                    <Link className="dropdown-item" to="/admin/settings">
                                        <i className="fas fa-cogs fa-sm fa-fw mr-2 text-gray-400"></i>
                                        Settings
                                    </Link>
                                    <div className="dropdown-divider"></div>
                                    <a className="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#logoutModal">
                                        <i className="fas fa-sign-out-alt fa-sm fa-fw mr-2 text-gray-400"></i>
                                        Logout
                                    </a>
                                </div>
                            </li>
                        </ul>
                    </nav>
                    {/* End Topbar */}

                    <div className="container-fluid">
                        <div className="admin-header">
                            <div className="header-left">
                                <h1 className="admin-title">
                                    <span className="title-icon">📋</span>
                                    Pending Registrasi
                                </h1>
                                <p className="admin-subtitle">
                                    Verifikasi dan kelola registrasi pengguna baru
                                </p>
                            </div>
                            <div className="header-right">
                                <div className="stats-summary">
                                    <div className="stat-item">
                                        <span className="stat-number">{registrasiData.filter(item => item.status === 'pending').length}</span>
                                        <span className="stat-label">Pending</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-number">{registrasiData.filter(item => item.status === 'approved').length}</span>
                                        <span className="stat-label">Approved</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-number">{registrasiData.filter(item => item.status === 'rejected').length}</span>
                                        <span className="stat-label">Rejected</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="admin-filters">
                            <div className="filter-group">
                                <div className="search-box">
                                    <input
                                        type="text"
                                        placeholder="Cari berdasarkan nama, email, atau HP..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="search-input"
                                    />
                                    <span className="search-icon">🔍</span>
                                </div>
                                
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>

                            <div className="bulk-actions">
                                <button 
                                    className="btn btn-success"
                                    onClick={() => handleBulkAction('approved')}
                                    disabled={selectedIds.length === 0}
                                >
                                    ✅ Setujui Terpilih
                                </button>
                                <button 
                                    className="btn btn-danger"
                                    onClick={() => handleBulkAction('rejected')}
                                    disabled={selectedIds.length === 0}
                                >
                                    ❌ Tolak Terpilih
                                </button>
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.length === filteredData.length && filteredData.length > 0}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th>Nama Lengkap</th>
                                        <th>Email</th>
                                        <th>No. HP</th>
                                        <th>Tanggal Registrasi</th>
                                        <th>Status</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.length > 0 ? (
                                        filteredData.map((item) => (
                                            <tr key={item.id}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(item.id)}
                                                        onChange={() => handleCheckboxChange(item.id)}
                                                    />
                                                </td>
                                                <td>
                                                    <div className="user-info">
                                                        <div className="user-avatar">
                                                            {item.nama_lengkap.split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                        <div className="user-details">
                                                            <strong>{item.nama_lengkap}</strong>
                                                            <small>KTP: {item.foto_ktp ? item.foto_ktp.split('/').pop() : 'N/A'}</small> 
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{item.email}</td>
                                                <td>{item.no_hp}</td>
                                                <td>{formatDate(item.created_at)}</td> 
                                                <td>{getStatusBadge(item.status)}</td> 
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="btn btn-sm btn-info"
                                                            onClick={() => openModal(item)}
                                                            title="Lihat Detail"
                                                        >
                                                            👁️
                                                        </button>
                                                        {item.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    className="btn btn-sm btn-success"
                                                                    onClick={() => handleStatusChange(item.id, 'approved')}
                                                                    title="Setujui"
                                                                >
                                                                    ✅
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-danger"
                                                                    onClick={() => handleStatusChange(item.id, 'rejected')}
                                                                    title="Tolak"
                                                                >
                                                                    ❌
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="text-center">
                                                {loading ? 'Memuat data...' : 'Tidak ada data registrasi.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {filteredData.length === 0 && !loading && (
                                <div className="empty-state">
                                    <div className="empty-icon">📭</div>
                                    <h3>Tidak ada data registrasi</h3>
                                    <p>Belum ada data registrasi yang sesuai dengan filter Anda.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {/* Footer Admin Placeholder */}
                <footer className="sticky-footer bg-white">
                    <div className="container my-auto">
                        <div className="copyright text-center my-auto">
                            <span>Copyright &copy; Motor Rental 2024</span>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Modal Detail */}
            {showModal && modalData && (
                <div className="modal-overlay active">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Detail Registrasi</h3>
                            <button className="close-btn" onClick={closeModal}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <label>Nama Lengkap:</label>
                                    <span>{modalData.nama_lengkap}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Email:</label>
                                    <span>{modalData.email}</span>
                                </div>
                                <div className="detail-item">
                                    <label>No. HP:</label>
                                    <span>{modalData.no_hp}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Jenis Kelamin:</label>
                                    <span>{modalData.jenis_kelamin}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Alamat:</label>
                                    <span>
                                        {modalData.dusun}, RT {modalData.rt}/RW {modalData.rw}, {modalData.desa}, {modalData.kecamatan}, {modalData.kota}, {modalData.provinsi}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <label>Tanggal Registrasi:</label>
                                    <span>{formatDate(modalData.created_at)}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Status:</label>
                                    <span>{getStatusBadge(modalData.status)}</span>
                                </div>
                            </div>
                            
                            <div className="document-preview">
                                <h4>Dokumen KTP</h4>
                                <div className="document-placeholder">
                                    {modalData.foto_ktp ? (
                                        <>
                                            📄 {modalData.foto_ktp.split('/').pop()}
                                            <button 
                                                className="btn btn-sm btn-primary"
                                                onClick={() => viewDocument(modalData.foto_ktp)}
                                            >
                                                Lihat Dokumen
                                            </button>
                                        </>
                                    ) : (
                                        <span>Tidak ada dokumen KTP</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            {modalData.status === 'pending' && (
                                <>
                                    <button
                                        className="btn btn-success"
                                        onClick={() => {
                                            handleStatusChange(modalData.id, 'approved');
                                            closeModal();
                                        }}
                                    >
                                        ✅ Setujui
                                    </button>
                                    <button
                                        className="btn btn-danger"
                                        onClick={() => {
                                            handleStatusChange(modalData.id, 'rejected');
                                            closeModal();
                                        }}
                                    >
                                        ❌ Tolak
                                    </button>
                                </>
                            )}
                            <button className="btn btn-secondary" onClick={closeModal}>
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout Modal (contoh, perlu di global AdminLayout) */}
            {/* Ini akan dihapus total */}
        </div>
    );
};

export default PendingRegistrasi;