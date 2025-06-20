// frontend/src/components/admin/Sidebar.jsx

import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // ✅ Impor useNavigate
import '../../assets/css/admin/sidebar.css'; // Impor CSS khusus sidebar
import '../../assets/css/global.css'; // Global CSS mungkin diperlukan juga di sini

const Sidebar = () => {
    const navigate = useNavigate(); // Inisialisasi useNavigate

    // Fungsi untuk menangani proses logout
    const handleLogout = () => {
        // Hapus token JWT dan informasi pengguna dari localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Arahkan pengguna ke halaman login
        navigate('/login');
    };

    return (
        <ul className="navbar-nav bg-gradient-primary sidebar sidebar-dark accordion" id="accordionSidebar">
            {/* Sidebar - Brand */}
            <a className="sidebar-brand d-flex align-items-center justify-content-center" href="/admin/dashboard">
                <div className="sidebar-brand-icon rotate-n-15">
                    <i className="fas fa-motorcycle"></i>
                </div>
                <div className="sidebar-brand-text mx-3">Motor Rental</div>
            </a>

            {/* Divider */}
            <hr className="sidebar-divider my-0" />

            {/* Nav Item - Dashboard */}
            <li className="nav-item active">
                <Link className="nav-link" to="/admin/dashboard">
                    <i className="fas fa-fw fa-tachometer-alt"></i>
                    <span>Dashboard</span>
                </Link>
            </li>

            {/* Divider */}
            <hr className="sidebar-divider" />

            {/* Heading */}
            <div className="sidebar-heading">
                Manajemen User
            </div>

            {/* Nav Item - Verifikasi & Aktivasi */}
            <li className="nav-item">
                <Link className="nav-link" to="/admin/verifikasi">
                    <i className="fas fa-fw fa-user-check"></i>
                    <span>Verifikasi & Aktivasi</span>
                </Link>
            </li>

            {/* Nav Item - Pending Registrasi */}
            <li className="nav-item">
                <Link className="nav-link" to="/admin/pending-registrasi">
                    <i className="fas fa-fw fa-user-clock"></i>
                    <span>Pending Registrasi</span>
                </Link>
            </li>

            {/* Nav Item - User */}
            <li className="nav-item">
                <Link className="nav-link" to="/admin/user">
                    <i className="fas fa-fw fa-users"></i>
                    <span>User</span>
                </Link>
            </li>

            {/* Divider */}
            <hr className="sidebar-divider" />

            {/* Heading */}
            <div className="sidebar-heading">
                Manajemen Rental
            </div>

            {/* Nav Item - Motor */}
            <li className="nav-item">
                <Link className="nav-link" to="/admin/motor">
                    <i className="fas fa-fw fa-motorcycle"></i>
                    <span>Motor</span>
                </Link>
            </li>

            {/* Nav Item - Reservasi */}
            <li className="nav-item">
                <Link className="nav-link" to="/admin/reservasi">
                    <i className="fas fa-fw fa-calendar-alt"></i>
                    <span>Reservasi</span>
                </Link>
            </li>

            {/* Nav Item - Pembayaran */}
            <li className="nav-item">
                <Link className="nav-link" to="/admin/pembayaran">
                    <i className="fas fa-fw fa-credit-card"></i>
                    <span>Pembayaran</span>
                </Link>
            </li>

            {/* Nav Item - Testimoni */}
            <li className="nav-item">
                <Link className="nav-link" to="/admin/testimoni">
                    <i className="fas fa-fw fa-star"></i>
                    <span>Testimoni</span>
                </Link>
            </li>

            {/* Divider */}
            <hr className="sidebar-divider" />

            {/* Nav Item - Settings */}
            <li className="nav-item">
                <Link className="nav-link" to="/admin/settings">
                    <i className="fas fa-fw fa-cogs"></i>
                    <span>Settings</span>
                </Link>
            </li>

            {/* Divider */}
            <hr className="sidebar-divider d-none d-md-block" />

            {/* Nav Item - Logout (Tambahan baru) */}
            <li className="nav-item">
                {/* Gunakan a tag dengan onClick untuk logout, bukan Link to="/login" langsung */}
                {/* Ini agar fungsi handleLogout dipanggil untuk membersihkan localStorage */}
                <a className="nav-link" href="#" onClick={handleLogout}> 
                    <i className="fas fa-fw fa-sign-out-alt"></i>
                    <span>Logout</span>
                </a>
            </li>
        </ul>
    );
};

export default Sidebar;