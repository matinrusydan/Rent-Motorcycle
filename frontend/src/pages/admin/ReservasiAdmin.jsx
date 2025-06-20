// frontend/src/pages/admin/ReservasiAdmin.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios'; // Impor axios
import Sidebar from '../../components/admin/Sidebar.jsx'; 

// CSS yang relevan
import '../../assets/css/admin/dashboard.css';   // Untuk gaya admin umum (cards, topbar, dll.)
import '../../assets/css/admin/sidebar.css';    // Untuk gaya sidebar
import '../../assets/css/admin/reservasi.css';  // CSS khusus untuk halaman reservasi
import '../../assets/css/global.css';          // Global CSS

const ReservasiAdmin = () => {
    const [reservations, setReservations] = useState([]); // Data reservasi akan diambil dari backend
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [refreshTrigger, setRefreshTrigger] = useState(0); // Untuk memicu refresh data

    const navigate = useNavigate();

    // Get API URL
    const getApiUrl = () => {
        return import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';
    };

    // Fungsi untuk mengambil data reservasi dari backend
    const fetchReservations = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token'); // Ambil token
            if (!token) {
                alert('Sesi Anda berakhir, silakan login kembali.');
                navigate('/login');
                setLoading(false);
                return;
            }

            // Endpoint untuk mendapatkan semua reservasi (akan kita buat di backend)
            const response = await axios.get(`${getApiUrl()}/api/admin/reservations`, { 
                headers: {
                    Authorization: `Bearer ${token}`
                },
                timeout: 15000 // 15 detik timeout
            });
            // Asumsi data reservasi ada di response.data.data, dan status sudah ada
            setReservations(response.data.data); 
        } catch (error) {
            console.error('Error fetching reservations:', error);
            alert(`Gagal memuat data reservasi: ${error.response?.data?.message || error.message}. Pastikan Anda login sebagai admin.`);
            if (error.response?.status === 401 || error.response?.status === 403) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    // Efek untuk memuat data saat komponen di-mount atau refreshTrigger berubah
    useEffect(() => {
        fetchReservations();
    }, [refreshTrigger, navigate]);

    // Fungsi untuk memfilter data reservasi
    const filteredReservations = reservations.filter(item => {
        // Asumsi item.nama_lengkap, item.motor_name (jika di-join), item.status, item.no_hp dari backend
        const matchesSearch = (item.nama_lengkap?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                              (item.motor_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                              (item.no_hp || '').includes(searchTerm);
        const matchesStatus = filterStatus === 'all' || (item.status?.toLowerCase() || '') === filterStatus; 
        return matchesSearch && matchesStatus;
    });

    // Fungsi untuk mendapatkan badge status
    const getStatusBadge = (status) => {
        const badges = {
            pending: { text: 'Menunggu', class: 'status-pending', icon: '⏳' },
            confirmed: { text: 'Dikonfirmasi', class: 'status-confirmed', icon: '✅' },
            completed: { text: 'Selesai', class: 'status-completed', icon: '✔️' },
            cancelled: { text: 'Dibatalkan', class: 'status-cancelled', icon: '❌' }
        };
        return badges[status?.toLowerCase()] || badges.pending;
    };

    // Fungsi untuk format tanggal
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Fungsi untuk mengubah status reservasi
    const handleStatusChange = async (id, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            if (!confirm(`Apakah Anda yakin ingin mengubah status reservasi ini menjadi ${newStatus}?`)) {
                return;
            }
            // ✅ Endpoint untuk update status reservasi (akan kita buat di backend)
            const response = await axios.put(`${getApiUrl()}/api/admin/reservations/${id}/status`, 
                { status: newStatus }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(response.data.message);
            setRefreshTrigger(prev => prev + 1); // Memicu refresh data
        } catch (error) {
            console.error('Error changing reservation status:', error);
            alert(`Gagal mengubah status reservasi: ${error.response?.data?.message || error.message}. Pastikan Anda memiliki izin admin.`);
        }
    };

    // Fungsi untuk menghubungi customer via WhatsApp
    const contactCustomer = (reservation) => {
        const message = encodeURIComponent(
            `Halo ${reservation.nama_lengkap || reservation.namaPenyewa}, kami menghubungi Anda terkait reservasi motor ${reservation.motor_name || reservation.motor} pada tanggal ${formatDate(reservation.tanggal_sewa || reservation.tanggalSewa)}. Terima kasih.`
        );
        const waUrl = `https://wa.me/${reservation.no_hp || reservation.noHp}?text=${message}`;
        window.open(waUrl, '_blank');
    };
    
    // Handler untuk sidebar toggle (disalin dari DashboardAdmin.jsx)
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
        handleResize(); 
        return () => { window.removeEventListener('resize', handleResize); };
    }, [isSidebarToggled]);
    const handleSidebarToggle = () => setIsSidebarToggled(!isSidebarToggled);


    if (loading) {
        return (
            <div id="wrapper" className={isSidebarToggled ? 'sidebar-toggled' : ''}>
                <Sidebar />
                <div id="content-wrapper" className={`d-flex flex-column ${isSidebarToggled ? 'toggled' : ''}`}>
                    <div id="content">
                        {/* Topbar Placeholder */}
                        <nav className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow">
                            <button id="sidebarToggleTop" className="btn btn-link d-md-none rounded-circle mr-3" onClick={handleSidebarToggle}>
                                <i className="fa fa-bars"></i>
                            </button>
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
                                        <a className="dropdown-item" href="#" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }}>
                                            <i className="fas fa-sign-out-alt fa-sm fa-fw mr-2 text-gray-400"></i>
                                            Logout
                                        </a>
                                    </div>
                                </li>
                            </ul>
                        </nav>
                        <div className="loading-container">
                            <div className="loading-spinner">⏳</div>
                            <p>Memuat data reservasi...</p>
                        </div>
                    </div>
                    <footer className="sticky-footer bg-white">
                        <div className="container my-auto">
                            <div className="copyright text-center my-auto">
                                <span>Copyright &copy; Motor Rental 2024</span>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        );
    }

    return (
        <div id="wrapper">
            <Sidebar />

            <div id="content-wrapper" className="d-flex flex-column">
                <div id="content">
                    {/* Topbar */}
                    <nav className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow">
                        <button id="sidebarToggleTop" className="btn btn-link d-md-none rounded-circle mr-3" onClick={handleSidebarToggle}>
                            <i className="fa fa-bars"></i>
                        </button>
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
                                    <a className="dropdown-item" href="#" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }}>
                                        <i className="fas fa-sign-out-alt fa-sm fa-fw mr-2 text-gray-400"></i>
                                        Logout
                                    </a>
                                </div>
                            </li>
                        </ul>
                    </nav>

                    <div className="container-fluid">
                        <div className="admin-header">
                            <div className="header-left">
                                <h1 className="admin-title">
                                    <span className="title-icon">📅</span>
                                    Manajemen Reservasi
                                </h1>
                                <p className="admin-subtitle">
                                    Kelola dan pantau semua reservasi motor
                                </p>
                            </div>
                            <div className="header-right">
                                {/* Tambah tombol jika ada */}
                            </div>
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
                                            <option value="confirmed">Dikonfirmasi</option>
                                            <option value="completed">Selesai</option>
                                            <option value="cancelled">Dibatalkan</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabel Reservasi */}
                        <div className="card shadow mb-4">
                            <div className="card-header py-3">
                                <h6 className="m-0 font-weight-bold text-primary">Daftar Reservasi</h6>
                            </div>
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table table-bordered" width="100%" cellSpacing="0">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Penyewa</th>
                                                <th>Motor</th>
                                                <th>Tanggal Sewa</th>
                                                <th>Lama Sewa</th>
                                                <th>Status</th>
                                                <th>Catatan</th>
                                                <th>Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredReservations.length > 0 ? (
                                                filteredReservations.map(res => {
                                                    const statusBadge = getStatusBadge(res.status);
                                                    return (
                                                        <tr key={res.id}>
                                                            <td>{res.id}</td>
                                                            <td>
                                                                <div className="customer-info">
                                                                    <div className="customer-name">{res.nama_lengkap}</div> {/* Asumsi dari backend */}
                                                                    <div className="customer-phone">{res.no_hp}</div> {/* Asumsi dari backend */}
                                                                </div>
                                                            </td>
                                                            <td>{res.motor_name}</td> {/* Asumsi motor_name dari join */}
                                                            <td>{formatDate(res.tanggal_sewa)}</td>
                                                            <td>{res.lama_sewa_hari} hari</td>
                                                            <td>
                                                                <span className={`badge ${statusBadge.class}`}>
                                                                    {statusBadge.icon} {statusBadge.text}
                                                                </span>
                                                            </td>
                                                            <td>{res.catatan}</td>
                                                            <td>
                                                                <div className="d-flex flex-column">
                                                                    {res.status.toLowerCase() === 'pending' && (
                                                                        <>
                                                                            <button 
                                                                                className="btn btn-success btn-sm mb-1"
                                                                                onClick={() => handleStatusChange(res.id, 'Confirmed')}
                                                                            >
                                                                                Konfirmasi
                                                                            </button>
                                                                            <button 
                                                                                className="btn btn-danger btn-sm mb-1"
                                                                                onClick={() => handleStatusChange(res.id, 'Cancelled')}
                                                                            >
                                                                                Batalkan
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                    {res.status.toLowerCase() === 'confirmed' && (
                                                                        <button 
                                                                            className="btn btn-primary btn-sm mb-1"
                                                                            onClick={() => handleStatusChange(res.id, 'Completed')}
                                                                        >
                                                                            Selesai
                                                                        </button>
                                                                    )}
                                                                    <button 
                                                                        className="btn btn-info btn-sm"
                                                                        onClick={() => contactCustomer(res)}
                                                                    >
                                                                        Hubungi
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan="8" className="text-center">
                                                        {loading ? 'Memuat data...' : 'Tidak ada data reservasi.'}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
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
        </div>
    );
};

export default ReservasiAdmin;