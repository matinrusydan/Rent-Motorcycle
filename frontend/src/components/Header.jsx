// frontend/src/components/Header.jsx

import React, { useState, useEffect } from 'react'; // Import useEffect
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import '../assets/css/navbar.css';
import '../assets/css/global.css';

const Header = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    // 1. Add a state to manage login status
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate(); // Initialize useNavigate hook

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // 2. Check login status on component mount
    useEffect(() => {
        // This is a simplified example.
        // In a real app, you'd check for a token in localStorage,
        // or a user object in context/redux.
        const token = localStorage.getItem('authToken'); // Example: check for a token
        if (token) {
            setIsLoggedIn(true);
        } else {
            setIsLoggedIn(false);
        }
    }, []); // Empty dependency array means this runs once on mount

    const handleLogout = () => {
        // 3. Implement logout logic
        localStorage.removeItem('authToken'); // Example: remove the token
        setIsLoggedIn(false); // Update state
        navigate('/login'); // Redirect to login page after logout (optional)
        toggleMobileMenu(); // Close mobile menu if open
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

                    {/* 4. Conditional rendering for auth buttons */}
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
                    {/* 5. Conditional rendering for mobile auth buttons */}
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