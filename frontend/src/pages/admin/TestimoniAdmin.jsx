// frontend/src/pages/admin/TestimoniAdmin.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/admin/Sidebar.jsx';

// CSS yang relevan
import '../../assets/css/admin/dashboard.css';
import '../../assets/css/admin/sidebar.css';
import '../../assets/css/global.css';

const TestimoniAdmin = () => {
    // State untuk daftar testimoni
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0); // Untuk memicu refresh data

    const navigate = useNavigate();

    const getApiUrl = () => {
        return import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';
    };

    // === START: Fungsionalitas SIDEBAR ===
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
    // === END: Fungsionalitas SIDEBAR ===

    // === START: FUNGSI UNTUK MENGAMBIL DATA TESTIMONI DARI BACKEND ===
    const fetchTestimonials = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Your session has expired, please log in again.');
                navigate('/login');
                setLoading(false);
                return;
            }

            // Panggil API untuk mendapatkan semua testimoni (admin)
            const response = await axios.get(`${getApiUrl()}/api/admin/testimonials`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                timeout: 15000 // Timeout 15 detik
            });
            setTestimonials(response.data.data);
        } catch (error) {
            console.error('Error fetching testimonials:', error);
            const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred.';
            alert(`Failed to load testimonial data: ${errorMessage}. Please ensure you are logged in as an admin.`);
            if (error.response?.status === 401 || error.response?.status === 403) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchTestimonials();
    }, [refreshTrigger, fetchTestimonials]); // refreshTrigger dan fetchTestimonials sebagai dependency
    // === END: FUNGSI UNTUK MENGAMBIL DATA TESTIMONI DARI BACKEND ===


    // Fungsi untuk memfilter data testimoni di frontend
    const filteredTestimonials = testimonials.filter(item => {
        // Asumsi item.status dari backend akan selalu ada dan string
        const matchesStatus = filterStatus === 'all' || (item.status?.toLowerCase() === filterStatus.toLowerCase());
        // Asumsi item.user_nama_lengkap, item.content, item.user_email dari backend
        const matchesSearch = (item.user_nama_lengkap?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                              (item.content?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                              (item.user_email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        return matchesSearch && matchesStatus;
    });

    // Fungsi untuk mendapatkan badge status
    const getStatusBadge = (status) => {
        // Menggunakan toLowerCase() untuk memastikan case-insensitivity
        const lowerStatus = status?.toLowerCase();
        const badges = {
            pending: { text: 'Menunggu', class: 'badge bg-warning text-dark' },
            approved: { text: 'Disetujui', class: 'badge bg-success' },
            rejected: { text: 'Ditolak', class: 'badge bg-danger' }
        };
        return badges[lowerStatus] || badges.pending;
    };

    // Fungsi untuk mengubah status testimoni (Backend Call)
    const handleStatusChange = async (id, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Your session has expired, please log in again.');
                navigate('/login');
                return;
            }
            // Menggunakan window.confirm untuk konfirmasi penghapusan
            if (!window.confirm(`Are you sure you want to change the status of this testimonial to ${newStatus}?`)) {
                return;
            }

            // Panggil API PUT untuk mengubah status testimoni
            const response = await axios.put(`${getApiUrl()}/api/admin/testimonials/${id}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert(response.data.message);
            setRefreshTrigger(prev => prev + 1); // Memicu pengambilan ulang data
        } catch (error) {
            console.error('Error changing testimonial status:', error);
            const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred.';
            alert(`Failed to change testimonial status: ${errorMessage}.`);
        }
    };

    // Fungsi baru: Menghapus testimoni
    const handleDeleteTestimonial = async (id) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Your session has expired, please log in again.');
                navigate('/login');
                return;
            }
            // Menggunakan window.confirm untuk konfirmasi penghapusan
            if (!window.confirm('Are you sure you want to delete this testimonial?')) {
                return;
            }

            // Panggil API DELETE untuk menghapus testimoni
            const response = await axios.delete(`${getApiUrl()}/api/admin/testimonials/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert(response.data.message);
            setRefreshTrigger(prev => prev + 1); // Memicu pengambilan ulang data
        } catch (error) {
            console.error('Error deleting testimonial:', error);
            const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred.';
            alert(`Failed to delete testimonial: ${errorMessage}.`);
        }
    };

    // Fungsi untuk format tanggal (misalnya created_at)
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
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
            return dateString;
        }
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
                            <p>Loading testimonial data...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div id="wrapper" className={isSidebarToggled ? 'sidebar-toggled' : ''}>
            <Sidebar />

            <div id="content-wrapper" className="d-flex flex-column">
                <div id="content">
                    <div className="container-fluid">
                        <div className="d-sm-flex align-items-center justify-content-between mb-4">
                            <h1 className="h3 mb-0 text-gray-800">Testimonial Management</h1>
                        </div>

                        {/* Filter dan Search */}
                        <div className="card shadow mb-4">
                            <div className="card-body">
                                <div className="admin-controls">
                                    <div className="search-group">
                                        <input
                                            type="text"
                                            placeholder="Search name or testimonial content..."
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
                                            <option value="all">All Status</option>
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabel Testimoni */}
                        <div className="card shadow mb-4">
                            <div className="card-header py-3">
                                <h6 className="m-0 font-weight-bold text-primary">Testimonial List</h6>
                            </div>
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table table-bordered" width="100%" cellSpacing="0">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Name</th>
                                                <th>Testimonial Content</th>
                                                <th>Rating</th>
                                                <th>Date</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredTestimonials.length > 0 ? (
                                                filteredTestimonials.map(t => {
                                                    const statusBadge = getStatusBadge(t.status);
                                                    return (
                                                        <tr key={t.id}>
                                                            <td>{t.id}</td>
                                                            <td>
                                                                <div className="customer-info">
                                                                    <div className="customer-name">{t.user_nama_lengkap}</div>
                                                                    <div className="customer-email text-muted">{t.user_email}</div>
                                                                </div>
                                                            </td>
                                                            <td>{t.content}</td>
                                                            <td>{'⭐'.repeat(t.rating)}</td>
                                                            <td>{formatDate(t.created_at)}</td>
                                                            <td>
                                                                <span className={statusBadge.class}>
                                                                    {statusBadge.text}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {t.status.toLowerCase() === 'pending' && (
                                                                    <>
                                                                        <button
                                                                            className="btn btn-success btn-sm me-2"
                                                                            onClick={() => handleStatusChange(t.id, 'approved')}
                                                                        >
                                                                            Approve
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-danger btn-sm"
                                                                            onClick={() => handleStatusChange(t.id, 'rejected')}
                                                                        >
                                                                            Reject
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {/* Tombol Hapus: Selalu muncul, atau hanya jika status bukan 'pending' */}
                                                                <button
                                                                    className="btn btn-danger btn-sm ms-2" // ms-2 for margin-left
                                                                    onClick={() => handleDeleteTestimonial(t.id)}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan="7" className="text-center">
                                                        {loading ? 'Loading data...' : 'No testimonial data.'}
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

export default TestimoniAdmin;
