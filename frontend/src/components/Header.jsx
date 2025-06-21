// frontend/src/components/Header.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../assets/css/navbar.css';
import '../assets/css/global.css';

const Header = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Periksa status login saat komponen dimuat atau saat terjadi perubahan navigasi
    useEffect(() => {
        // *** GUNAKAN KUNCI 'token' SESUAI DENGAN Login.jsx ***
        const token = localStorage.getItem('token'); // Mengambil token yang disimpan oleh Login.jsx
        
        // Log untuk debugging: lihat nilai token
        console.log('Header - Token dari localStorage:', token); 

        if (token) {
            setIsLoggedIn(true);
        } else {
            setIsLoggedIn(false);
        }
    }, [navigate]); // Tambahkan navigate sebagai dependensi agar effect berjalan saat navigasi berubah

    const handleLogout = () => {
        // Hapus token dan data user saat logout
        localStorage.removeItem('token'); // Hapus token
        localStorage.removeItem('user');  // Hapus data user juga
        setIsLoggedIn(false); // Perbarui state menjadi tidak login
        navigate('/login'); // Arahkan ke halaman login
        toggleMobileMenu(); // Tutup menu mobile (jika terbuka)
    };

    return (
        <header className="header">
            <div className="container">
                <nav className="navbar">
                    <div className="logo">
                        <Link to="/"><h2>🏍️ RentalMotor</h2></Link>
                    </div>

                    <div className="nav-links">
                        <Link to="/" className="nav-link">Beranda</Link>
                        <a href="#motor" className="nav-link">Motor</a>
                        <a href="#testimoni" className="nav-link">Testimoni</a>
                        <Link to="/tentang" className="nav-link">Tentang</Link>
                    </div>

                    {/* Conditional rendering untuk tombol autentikasi */}
                    <div className="auth-buttons">
                        {isLoggedIn ? (
                            <button onClick={handleLogout} className="btn btn-login">Logout</button>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-login">Login</Link>
                                <Link to="/register" className="btn btn-register">Daftar</Link>
                            </>
                        )}
                    </div>

                    <div className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`} onClick={toggleMobileMenu}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </nav>

                <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
                    <div className="mobile-nav-links">
                        <Link to="/" className="mobile-nav-link" onClick={toggleMobileMenu}>Beranda</Link>
                        <a href="#motor" className="mobile-nav-link" onClick={toggleMobileMenu}>Motor</a>
                        <a href="#testimoni" className="mobile-nav-link" onClick={toggleMobileMenu}>Testimoni</a>
                        <Link to="/tentang" className="mobile-nav-link" onClick={toggleMobileMenu}>Tentang</Link>
                    </div>
                    {/* Conditional rendering untuk tombol autentikasi seluler */}
                    <div className="mobile-auth-buttons">
                        {isLoggedIn ? (
                            <button onClick={handleLogout} className="btn btn-login">Logout</button>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-login" onClick={toggleMobileMenu}>Login</Link>
                                <Link to="/register" className="btn btn-register" onClick={toggleMobileMenu}>Daftar</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;