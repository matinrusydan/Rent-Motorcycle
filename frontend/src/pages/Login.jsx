// frontend/src/pages/Login.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../assets/css/login.css';
import '../assets/css/global.css';

const Login = () => {
    // Form state
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    // UI state
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [isFormValid, setIsFormValid] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    // Get API URL with fallback
    const getApiUrl = () => {
        return import.meta.env.VITE_API_URL || 
               import.meta.env.VITE_APP_API_URL || 
               'http://localhost:5000';
    };

    // Check if user is already logged in
    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
            try {
                const userData = JSON.parse(user);
                // Redirect based on role
                if (userData.role === 'admin') {
                    navigate('/admin/dashboard', { replace: true });
                } else {
                    navigate('/', { replace: true });
                }
            } catch (error) {
                // Clear invalid data
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
    }, [navigate]);

    // Handle messages from other pages (like registration success)
    useEffect(() => {
        if (location.state?.message) {
            setMessage(location.state.message);
            setMessageType(location.state.type || 'info');
            
            // Clear the state to prevent message from persisting on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    // Form validation
    useEffect(() => {
        const hasNoErrors = Object.keys(fieldErrors).length === 0;
        const isEmailFilled = formData.email.trim() !== '';
        const isPasswordFilled = formData.password.trim() !== '';
        
        setIsFormValid(hasNoErrors && isEmailFilled && isPasswordFilled);
    }, [formData, fieldErrors]);

    // Validate individual fields
    const validateField = (fieldName, value) => {
        setFieldErrors(prevErrors => {
            const errors = { ...prevErrors };
            
            switch (fieldName) {
                case 'email': {
                    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!value.trim()) {
                        errors.email = 'Email harus diisi';
                    } else if (!emailPattern.test(value)) {
                        errors.email = 'Format email tidak valid';
                    } else {
                        delete errors.email;
                    }
                    break;
                }
                case 'password': {
                    if (!value.trim()) {
                        errors.password = 'Password harus diisi';
                    } else if (value.length < 6) {
                        errors.password = 'Password minimal 6 karakter';
                    } else {
                        delete errors.password;
                    }
                    break;
                }
                default:
                    break;
            }
            
            return errors;
        });
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Validate field on change
        validateField(name, value);
        
        // Clear general error message when user starts typing
        if (message && messageType === 'error') {
            setMessage('');
            setMessageType('');
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setMessageType('');
        setIsLoading(true);

        console.log('Login attempt started');
        console.log('Form data:', { email: formData.email, password: '***' });

        // Validate all fields before submission
        const tempErrors = {};
        
        if (!formData.email.trim()) {
            tempErrors.email = 'Email harus diisi';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            tempErrors.email = 'Format email tidak valid';
        }
        
        if (!formData.password.trim()) {
            tempErrors.password = 'Password harus diisi';
        } else if (formData.password.length < 6) {
            tempErrors.password = 'Password minimal 6 karakter';
        }

        if (Object.keys(tempErrors).length > 0) {
            setFieldErrors(tempErrors);
            setMessage('Mohon perbaiki kesalahan pada form.');
            setMessageType('error');
            setIsLoading(false);
            return;
        }

        try {
            console.log('Sending login request to:', `${getApiUrl()}/api/auth/login`);
            
            const response = await axios.post(`${getApiUrl()}/api/auth/login`, {
                email: formData.email.trim(),
                password: formData.password
            }, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Login response received:', response.data);

            // Extract response data
            const { token, user, message: responseMessage } = response.data;

            if (!token || !user) {
                throw new Error('Response tidak lengkap dari server');
            }

            // Check if user is verified (only for non-admin users)
            if (user.role !== 'admin' && !user.is_verified) {
                setMessage('Akun Anda belum diverifikasi oleh admin. Mohon tunggu proses verifikasi.');
                setMessageType('error');
                setIsLoading(false);
                return;
            }

            // Store authentication data
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            // Show success message
            setMessage(responseMessage || 'Login berhasil!');
            setMessageType('success');

            console.log('Login successful, redirecting user with role:', user.role);

            // Redirect based on user role
            setTimeout(() => {
                if (user.role === 'admin') {
                    navigate('/admin/dashboard', { replace: true });
                } else {
                    navigate('/', { replace: true });
                }
            }, 1000);

        } catch (error) {
            console.error('Login error:', error);
            
            let errorMessage = 'Terjadi kesalahan saat login. Mohon coba lagi.';
            
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 401) {
                errorMessage = 'Email atau password salah.';
            } else if (error.response?.status === 403) {
                errorMessage = 'Akun Anda belum diverifikasi atau diblokir.';
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Koneksi timeout. Mohon coba lagi.';
            } else if (error.code === 'ERR_NETWORK') {
                errorMessage = 'Tidak dapat terhubung ke server. Pastikan backend berjalan.';
            }
            
            setMessage(errorMessage);
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container two-column">
                {/* Left Side - Hero/Image Section */}
                <div className="auth-left">
                    <div className="auth-hero">
                        <div className="auth-illustration">🏍️</div>
                        <h1>RentalMotor</h1>
                        <p>Solusi terbaik untuk kebutuhan rental motor Anda dengan layanan terpercaya dan kualitas terjamin</p>
                    </div>
                    
                    <div className="auth-features">
                        <div className="feature-item">
                            <div className="feature-icon">⚡</div>
                            <div className="feature-text">Proses Cepat</div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">🛡️</div>
                            <div className="feature-text">Aman Terpercaya</div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">💰</div>
                            <div className="feature-text">Harga Terjangkau</div>
                        </div>
                    </div>
                </div>
                
                {/* Right Side - Form Section */}
                <div className="auth-right">
                    <div className="form-container">
                        <div className="auth-header">
                            <h2>Masuk ke Akun Anda</h2>
                            <p>Silakan masuk untuk melanjutkan</p>
                        </div>

                        {/* Debug Info (remove in production) */}
                        {import.meta.env.DEV && (
                            <div style={{ padding: '10px', backgroundColor: '#f0f0f0', marginBottom: '10px', fontSize: '12px' }}>
                                <strong>Debug Info:</strong><br/>
                                API URL: {getApiUrl()}<br/>
                                Form Valid: {isFormValid ? '✓' : '✗'}<br/>
                                Errors: {Object.keys(fieldErrors).length}
                            </div>
                        )}

                        {/* Alert Messages */}
                        {message && (
                            <div className={`alert ${messageType === 'success' ? 'alert-success' : messageType === 'info' ? 'alert-info' : 'alert-danger'}`}>
                                {message}
                            </div>
                        )}
                        
                        <form className="auth-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="email">Email:</label>
                                <input 
                                    type="email" 
                                    id="email" 
                                    name="email"
                                    placeholder="contoh@email.com" 
                                    className={fieldErrors.email ? 'error' : ''}
                                    value={formData.email} 
                                    onChange={handleInputChange}
                                    disabled={isLoading}
                                    required
                                />
                                {fieldErrors.email && <span className="error-text">{fieldErrors.email}</span>}
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="password">Password:</label>
                                <input 
                                    type="password" 
                                    id="password" 
                                    name="password"
                                    placeholder="Masukkan password" 
                                    className={fieldErrors.password ? 'error' : ''}
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    disabled={isLoading}
                                    required
                                />
                                {fieldErrors.password && <span className="error-text">{fieldErrors.password}</span>}
                            </div>
                            
                            <div className="form-group">
                                <button 
                                    type="submit" 
                                    className={`btn-submit ${isLoading ? 'loading' : ''} ${!isFormValid ? 'disabled' : ''}`}
                                    disabled={isLoading || !isFormValid}
                                    style={{ 
                                        opacity: (isLoading || !isFormValid) ? 0.7 : 1,
                                        cursor: (isLoading || !isFormValid) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {isLoading ? 'Masuk...' : 'Masuk'}
                                </button>
                            </div>
                        </form>
                        
                        <div className="auth-links">
                            <p>Belum punya akun? <Link to="/register">Daftar di sini</Link></p>
                            <p><Link to="/">Kembali ke Beranda</Link></p>
                        </div>
                        
                        <div className="demo-accounts">
                            <h4>Demo Akun:</h4>
                            <p><strong>Admin:</strong> admin@rentalmotor.com / admin123</p>
                            <p><strong>User:</strong> user@email.com / password123</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;