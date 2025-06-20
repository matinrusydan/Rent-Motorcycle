// frontend/src/pages/admin/User.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/admin/Sidebar.jsx'; 

// CSS yang relevan
import '../../assets/css/admin/dashboard.css';
import '../../assets/css/admin/sidebar.css';
import '../../assets/css/admin/user.css';
import '../../assets/css/global.css';

const UserAdmin = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterRole, setFilterRole] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const navigate = useNavigate();

    // Get API URL
    const getApiUrl = () => {
        return import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';
    };

    // ✅ PERBAIKAN: Ubah endpoint dari /api/admin/users ke /api/auth/admin/users
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Sesi Anda berakhir, silakan login kembali.');
                navigate('/login');
                setLoading(false);
                return;
            }

            // ✅ ENDPOINT YANG BENAR: /api/auth/admin/users
            const response = await axios.get(`${getApiUrl()}/api/auth/admin/users`, { 
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setUsers(response.data.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            alert(`Gagal memuat data pengguna: ${error.response?.data?.message || error.message}. Pastikan Anda login sebagai admin.`);
            if (error.response?.status === 401 || error.response?.status === 403) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    // Efek untuk memuat data saat komponen di-mount atau refreshTrigger berubah
    useEffect(() => {
        fetchUsers();
    }, [refreshTrigger, navigate]);

    // Fungsi untuk memfilter data pengguna
    const filteredUsers = users.filter(user => {
        const userStatusString = user.is_verified ? 'active' : 'inactive';
        
        const matchesStatus = filterStatus === 'all' || userStatusString === filterStatus;
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        const matchesSearch = user.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              user.no_hp.includes(searchTerm);
        return matchesStatus && matchesRole && matchesSearch;
    });

    // Fungsi untuk mendapatkan badge status
    const getStatusBadge = (isVerified) => {
        const statusText = isVerified ? 'Aktif' : 'Nonaktif';
        const statusClass = isVerified ? 'badge bg-success status-badge' : 'badge bg-secondary status-badge';
        return { text: statusText, class: statusClass };
    };

    // Fungsi untuk mendapatkan badge role
    const getRoleBadge = (role) => {
        const roleClass = role === 'admin' ? 'role-badge role-admin' : 'role-badge role-user';
        return { text: role.charAt(0).toUpperCase() + role.slice(1), class: roleClass };
    };

    // ✅ PERBAIKAN: Ubah endpoint untuk status change
    const handleStatusChange = async (id, newStatus) => {
        const isVerified = newStatus === 'active';
        try {
            const token = localStorage.getItem('token');
            if (!confirm(`Apakah Anda yakin ingin mengubah status user ini menjadi ${newStatus}?`)) {
                return;
            }
            // ✅ ENDPOINT YANG BENAR: /api/auth/admin/users/${id}/status
            const response = await axios.put(`${getApiUrl()}/api/auth/admin/users/${id}/status`, 
                { is_verified: isVerified },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(response.data.message);
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error('Error changing user status:', error);
            alert(`Gagal mengubah status user: ${error.response?.data?.message || error.message}`);
        }
    };

    // ✅ PERBAIKAN: Ubah endpoint untuk delete user
    const handleDeleteUser = async (id) => {
        try {
            const token = localStorage.getItem('token');
            if (window.confirm('Apakah Anda yakin ingin menghapus pengguna ini secara permanen?')) {
                // ✅ ENDPOINT YANG BENAR: /api/auth/admin/users/${id}
                const response = await axios.delete(`${getApiUrl()}/api/auth/admin/users/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert(response.data.message);
                setRefreshTrigger(prev => prev + 1);
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert(`Gagal menghapus user: ${error.response?.data?.message || error.message}. Anda tidak bisa menghapus akun admin lain.`);
        }
    };

    if (loading) {
        return (
            <div id="wrapper">
                <Sidebar />
                <div id="content-wrapper" className="d-flex flex-column">
                    <div id="content">
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
                        <div className="loading-container">
                            <div className="loading-spinner">⏳</div>
                            <p>Memuat data pengguna...</p>
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

                    <div className="container-fluid user-management-container">
                        <div className="user-management-header d-sm-flex align-items-center justify-content-between mb-4">
                            <h1 className="h3 mb-0 text-gray-800">Manajemen Pengguna</h1>
                            <div className="text-muted">
                                Total: {filteredUsers.length} pengguna
                            </div>
                        </div>

                        {/* Filter dan Search */}
                        <div className="card user-card shadow mb-4">
                            <div className="card-body">
                                <div className="admin-controls d-flex flex-wrap gap-3">
                                    <div className="search-group flex-grow-1">
                                        <input
                                            type="text"
                                            placeholder="Cari nama, email, atau nomor HP..."
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
                                            <option value="active">Aktif</option>
                                            <option value="inactive">Nonaktif</option>
                                        </select>
                                    </div>
                                    <div className="filter-group">
                                        <select
                                            value={filterRole}
                                            onChange={(e) => setFilterRole(e.target.value)}
                                            className="form-select"
                                        >
                                            <option value="all">Semua Role</option>
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabel Pengguna */}
                        <div className="card user-card shadow mb-4">
                            <div className="card-header py-3">
                                <h6 className="m-0 font-weight-bold text-primary">Daftar Pengguna</h6>
                            </div>
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table table-bordered user-table" width="100%" cellSpacing="0">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Nama Lengkap</th>
                                                <th>Email</th>
                                                <th>No. HP</th>
                                                <th>Role</th>
                                                <th>Status</th>
                                                <th>Tanggal Daftar</th>
                                                <th>Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.length > 0 ? (
                                                filteredUsers.map(user => {
                                                    const statusBadge = getStatusBadge(user.is_verified);
                                                    const roleBadge = getRoleBadge(user.role);
                                                    return (
                                                        <tr key={user.id}>
                                                            <td>
                                                                <span className="user-id-badge">{user.id}</span>
                                                            </td>
                                                            <td className="text-truncate-custom" title={user.nama_lengkap}>
                                                                {user.nama_lengkap}
                                                            </td>
                                                            <td className="text-truncate-custom" title={user.email}>
                                                                {user.email}
                                                            </td>
                                                            <td>{user.no_hp}</td>
                                                            <td>
                                                                <span className={roleBadge.class}>
                                                                    {roleBadge.text}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className={statusBadge.class}>
                                                                    {statusBadge.text}
                                                                </span>
                                                            </td>
                                                            <td>{new Date(user.created_at).toLocaleDateString('id-ID')}</td>
                                                            <td>
                                                                <div className="action-buttons">
                                                                    {user.is_verified && user.role !== 'admin' && (
                                                                        <button 
                                                                            className="btn btn-warning btn-sm"
                                                                            onClick={() => handleStatusChange(user.id, 'inactive')}
                                                                            title="Nonaktifkan pengguna"
                                                                        >
                                                                            Nonaktifkan
                                                                        </button>
                                                                    )}
                                                                    {!user.is_verified && user.role !== 'admin' && (
                                                                        <button 
                                                                            className="btn btn-success btn-sm"
                                                                            onClick={() => handleStatusChange(user.id, 'active')}
                                                                            title="Aktifkan pengguna"
                                                                        >
                                                                            Aktifkan
                                                                        </button>
                                                                    )}
                                                                    {user.role !== 'admin' && (
                                                                        <button 
                                                                            className="btn btn-danger btn-sm"
                                                                            onClick={() => handleDeleteUser(user.id)}
                                                                            title="Hapus pengguna"
                                                                        >
                                                                            Hapus
                                                                        </button>
                                                                    )}
                                                                    {user.role === 'admin' && (
                                                                        <small className="text-muted">
                                                                            Admin terlindungi
                                                                        </small>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan="8" className="text-center">
                                                        {loading ? 'Memuat data...' : 'Tidak ada data pengguna yang sesuai dengan filter.'}
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

export default UserAdmin;