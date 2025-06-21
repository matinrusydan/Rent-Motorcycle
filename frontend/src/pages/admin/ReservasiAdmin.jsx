// frontend/src/pages/admin/ReservasiAdmin.jsx

import React, { useState, useEffect, useCallback } from 'react'; // Tambahkan useCallback
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/admin/Sidebar.jsx';

// CSS yang relevan
import '../../assets/css/admin/dashboard.css';
import '../../assets/css/admin/sidebar.css';
import '../../assets/css/admin/reservasi.css';
import '../../assets/css/global.css';

const ReservasiAdmin = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const navigate = useNavigate();

    const getApiUrl = () => {
        return import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';
    };

    // Fungsi untuk mengambil data reservasi dari backend
    const fetchReservations = useCallback(async () => { // Gunakan useCallback
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Sesi Anda berakhir, silakan login kembali.');
                navigate('/login');
                setLoading(false);
                return;
            }

            const response = await axios.get(`${getApiUrl()}/api/admin/reservations`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                timeout: 15000
            });
            setReservations(response.data.data);
        } catch (error) {
            console.error('Error fetching reservations:', error);
            // Tangkap pesan error dari backend jika ada, atau gunakan pesan default
            const errorMessage = error.response?.data?.message || error.message || 'Terjadi kesalahan tidak dikenal.';
            alert(`Gagal memuat data reservasi: ${errorMessage}. Pastikan Anda login sebagai admin.`);
            if (error.response?.status === 401 || error.response?.status === 403) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]); // Tambahkan navigate sebagai dependency

    // Efek untuk memuat data saat komponen di-mount atau refreshTrigger berubah
    useEffect(() => {
        fetchReservations();
    }, [refreshTrigger, fetchReservations]); // Tambahkan fetchReservations sebagai dependency

    // Fungsi untuk memfilter data reservasi
    const filteredReservations = reservations.filter(item => {
        const matchesSearch = (item.user_nama_lengkap?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || // Perbaiki nama properti
                              (item.motor_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                              (item.user_no_hp || '').includes(searchTerm); // Perbaiki nama properti
        const matchesStatus = filterStatus === 'all' || (item.status?.toLowerCase() || '') === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Fungsi untuk mendapatkan badge status
    const getStatusBadge = (status) => {
        const badges = {
            pending: { text: 'Menunggu Pembayaran', class: 'status-pending', icon: '⏳' }, // Ubah teks status
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

    // Fungsi untuk mengubah status reservasi (hanya untuk "Selesai" dan "Batalkan" sekarang)
    const handleStatusChange = async (id, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            if (!confirm(`Apakah Anda yakin ingin mengubah status reservasi ini menjadi ${newStatus}?`)) {
                return;
            }
            const response = await axios.put(`${getApiUrl()}/api/admin/reservations/${id}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(response.data.message);
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error('Error changing reservation status:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Terjadi kesalahan tidak dikenal.';
            alert(`Gagal mengubah status reservasi: ${errorMessage}. Pastikan Anda memiliki izin admin.`);
        }
    };

    // Fungsi untuk menghubungi customer via WhatsApp
    const contactCustomer = (reservation) => {
        const message = encodeURIComponent(
            `Halo ${reservation.user_nama_lengkap}, kami menghubungi Anda terkait reservasi motor ${reservation.motor_name} pada tanggal ${formatDate(reservation.tanggal_mulai)}. Total harga: Rp ${parseFloat(reservation.total_harga).toLocaleString('id-ID')}. Terima kasih.`
        );
        const waUrl = `https://wa.me/${reservation.user_no_hp}?text=${message}`; // Gunakan user_no_hp
        window.open(waUrl, '_blank');
    };

    // Handler untuk sidebar toggle
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
                                            <option value="pending">Menunggu Pembayaran</option> {/* Ubah teks */}
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
                                                                    <div className="customer-name">{res.user_nama_lengkap}</div> {/* Nama properti dari backend */}
                                                                    <div className="customer-phone">{res.user_no_hp}</div> {/* Nama properti dari backend */}
                                                                </div>
                                                            </td>
                                                            <td>{res.motor_name}</td>
                                                            <td>{formatDate(res.tanggal_mulai)}</td> {/* Gunakan tanggal_mulai dari backend */}
                                                            <td>{res.lama_sewa} hari</td> {/* Gunakan lama_sewa dari backend */}
                                                            <td>
                                                                <span className={`badge ${statusBadge.class}`}>
                                                                    {statusBadge.icon} {statusBadge.text}
                                                                </span>
                                                            </td>
                                                            <td>{res.catatan}</td>
                                                            <td>
                                                                <div className="d-flex flex-column">
                                                                    {/* HAPUS TOMBOL KONFIRMASI JIKA STATUS PENDING */}
                                                                    {/* Karena konfirmasi akan dilakukan dari persetujuan pembayaran */}
                                                                    
                                                                    {res.status.toLowerCase() === 'confirmed' && ( // Tombol Selesai hanya jika sudah dikonfirmasi
                                                                        <button
                                                                            className="btn btn-primary btn-sm mb-1"
                                                                            onClick={() => handleStatusChange(res.id, 'completed')} // Status 'completed'
                                                                        >
                                                                            Selesai
                                                                        </button>
                                                                    )}
                                                                    {/* Tombol Batalkan selalu ada jika belum selesai/dibatalkan */}
                                                                    {res.status.toLowerCase() !== 'cancelled' && res.status.toLowerCase() !== 'completed' && (
                                                                        <button
                                                                            className="btn btn-danger btn-sm mb-1"
                                                                            onClick={() => handleStatusChange(res.id, 'cancelled')} // Status 'cancelled'
                                                                        >
                                                                            Batalkan
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