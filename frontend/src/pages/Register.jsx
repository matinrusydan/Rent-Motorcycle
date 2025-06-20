// frontend/src/pages/Register.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../assets/css/register.css';
import '../assets/css/global.css';

const Register = () => {
    // State untuk form data
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        namaLengkap: '',
        noHp: '',
        jenisKelamin: '',
        dusun: '',
        rt: '',
        rw: '',
        desa: '',
        kecamatan: '',
        kota: '',
        provinsi: '',
        fotoKtp: null
    });

    // State untuk UI feedback
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [villages, setVillages] = useState([]);
    
    // State untuk validasi real-time
    const [fieldErrors, setFieldErrors] = useState({});
    const [isFormValid, setIsFormValid] = useState(false);

    const navigate = useNavigate();

    // Get API URL with fallback
    const getApiUrl = () => {
        return import.meta.env.VITE_API_URL || 
               import.meta.env.VITE_APP_API_URL || 
               'http://localhost:5000';
    };

    // Cek apakah semua field yang diperlukan sudah terisi
    const isAllFieldsFilled = useCallback(() => {
        const requiredFields = [
            'email', 'password', 'confirmPassword', 'namaLengkap', 'noHp', 
            'jenisKelamin', 'dusun', 'rt', 'rw', 'desa', 'kecamatan', 
            'kota', 'provinsi', 'fotoKtp'
        ];
        
        for (const field of requiredFields) {
            if (field === 'fotoKtp') {
                if (!formData[field]) return false;
            } else if (!formData[field] || (typeof formData[field] === 'string' && formData[field].trim() === '')) {
                return false;
            }
        }
        return true;
    }, [formData]);

    // Load data wilayah dari API
    useEffect(() => {
        loadProvinces();
    }, []);

    // Effect untuk memvalidasi form secara keseluruhan
    useEffect(() => {
        const hasNoErrors = Object.keys(fieldErrors).length === 0;
        const allFieldsFilled = isAllFieldsFilled();
        
        console.log('Form Validation Status:', { 
            hasNoErrors, 
            allFieldsFilled, 
            fieldErrors,
            formData: Object.keys(formData).reduce((acc, key) => {
                acc[key] = formData[key] ? '✓' : '✗';
                return acc;
            }, {})
        });
        
        setIsFormValid(hasNoErrors && allFieldsFilled);
    }, [formData, fieldErrors, isAllFieldsFilled]);

    // Load provinces dari API wilayah Indonesia
    const loadProvinces = async () => {
        try {
            const response = await axios.get('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
            setProvinces(response.data);
        } catch (error) {
            console.error('Error loading provinces:', error);
            setProvinces([
                { id: '32', name: 'Jawa Barat' },
                { id: '31', name: 'DKI Jakarta' },
                { id: '33', name: 'Jawa Tengah' },
                { id: '35', name: 'Jawa Timur' },
                { id: '36', name: 'Banten' },
                { id: '34', name: 'Yogyakarta' }
            ]);
        }
    };

    // Load cities berdasarkan provinsi
    const loadCities = async (provinceId) => {
        try {
            const response = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`);
            setCities(response.data);
            setDistricts([]);
            setVillages([]);
        } catch (error) {
            console.error('Error loading cities:', error);
            setCities([]);
        }
    };

    // Load districts berdasarkan kota
    const loadDistricts = async (cityId) => {
        try {
            const response = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${cityId}.json`);
            setDistricts(response.data);
            setVillages([]);
        } catch (error) {
            console.error('Error loading districts:', error);
            setDistricts([]);
        }
    };

    // Load villages berdasarkan kecamatan
    const loadVillages = async (districtId) => {
        try {
            const response = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${districtId}.json`);
            setVillages(response.data);
        } catch (error) {
            console.error('Error loading villages:', error);
            setVillages([]);
        }
    };

    // Validasi field individual
    const validateField = (fieldName, value) => {
        setFieldErrors(prevErrors => {
            const errors = { ...prevErrors };
            
            switch (fieldName) {
                case 'email': {
                    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!value) {
                        errors.email = 'Email harus diisi';
                    } else if (!emailPattern.test(value)) {
                        errors.email = 'Format email tidak valid';
                    } else {
                        delete errors.email;
                    }
                    break;
                }
                case 'password': {
                    if (!value) {
                        errors.password = 'Password harus diisi';
                    } else if (value.length < 6) {
                        errors.password = 'Password minimal 6 karakter';
                    } else {
                        delete errors.password;
                    }
                    // Validasi confirmPassword juga saat password berubah
                    if (formData.confirmPassword && value !== formData.confirmPassword) {
                        errors.confirmPassword = 'Password tidak cocok';
                    } else if (formData.confirmPassword && value === formData.confirmPassword) {
                        delete errors.confirmPassword;
                    }
                    break;
                }
                case 'confirmPassword': {
                    if (!value) {
                        errors.confirmPassword = 'Konfirmasi password harus diisi';
                    } else if (value !== formData.password) {
                        errors.confirmPassword = 'Password tidak cocok';
                    } else {
                        delete errors.confirmPassword;
                    }
                    break;
                }
                case 'noHp': {
                    const phonePattern = /^[0-9]{10,13}$/;
                    const cleanPhone = String(value).replace(/[^0-9]/g, '');
                    if (!value) {
                        errors.noHp = 'Nomor HP harus diisi';
                    } else if (!phonePattern.test(cleanPhone)) {
                        errors.noHp = 'Nomor HP harus 10-13 digit';
                    } else {
                        delete errors.noHp;
                    }
                    break;
                }
                case 'fotoKtp': {
                    if (!value) {
                        errors.fotoKtp = 'Foto KTP harus diupload';
                    } else if (value.size > 2 * 1024 * 1024) { // 2MB
                        errors.fotoKtp = 'Ukuran file maksimal 2MB';
                    } else if (!['image/jpeg', 'image/jpg', 'image/png'].includes(value.type)) {
                        errors.fotoKtp = 'Format file harus JPG, JPEG, atau PNG';
                    } else {
                        delete errors.fotoKtp;
                    }
                    break;
                }
                default: {
                    // Untuk semua field wajib lainnya
                    if (!value || (typeof value === 'string' && value.trim() === '')) {
                        errors[fieldName] = `${fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} harus diisi`;
                    } else {
                        delete errors[fieldName];
                    }
                }
            }
            return errors;
        });
    };

    // Handle perubahan input
    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        
        let newValue = value;
        if (name === 'fotoKtp') {
            newValue = files ? files[0] : null;
        }
        
        setFormData(prev => ({ ...prev, [name]: newValue }));
        
        // Validasi langsung tanpa setTimeout
        validateField(name, newValue);
        
        // Handle dependent dropdowns
        if (name === 'provinsi') {
            const selectedProvince = provinces.find(p => p.name === value);
            if (selectedProvince) {
                loadCities(selectedProvince.id);
                setFormData(prev => ({
                    ...prev,
                    kota: '',
                    kecamatan: '',
                    desa: ''
                }));
            }
        } else if (name === 'kota') {
            const selectedCity = cities.find(c => c.name === value);
            if (selectedCity) {
                loadDistricts(selectedCity.id);
                setFormData(prev => ({
                    ...prev,
                    kecamatan: '',
                    desa: ''
                }));
            }
        } else if (name === 'kecamatan') {
            const selectedDistrict = districts.find(d => d.name === value);
            if (selectedDistrict) {
                loadVillages(selectedDistrict.id);
                setFormData(prev => ({
                    ...prev,
                    desa: ''
                }));
            }
        }
    };

    // Check email availability
    const checkEmailAvailability = async (email) => {
        try {
            const apiUrl = getApiUrl();
            const response = await axios.post(`${apiUrl}/api/auth/check-email`, {
                email
            });
            return response.data.available;
        } catch (error) {
            console.error('Error checking email:', error);
            return true; 
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setMessageType('');
        setIsLoading(true);

        console.log('Form submission started');
        console.log('Current form data:', formData);
        console.log('Current field errors:', fieldErrors);
        console.log('Is form valid:', isFormValid);

        // Validasi ulang semua field
        const tempErrors = {};
        Object.keys(formData).forEach(key => {
            if (key === 'confirmPassword') return;
            
            const value = formData[key];
            if (key === 'fotoKtp') {
                if (!value) tempErrors[key] = 'Foto KTP harus diupload';
            } else if (!value || (typeof value === 'string' && value.trim() === '')) {
                tempErrors[key] = `${key} harus diisi`;
            }
        });

        if (Object.keys(tempErrors).length > 0) {
            setFieldErrors(tempErrors);
            setMessage('Mohon lengkapi semua field yang diperlukan.');
            setMessageType('error');
            setIsLoading(false);
            return;
        }

        try {
            // Check email availability
            const emailAvailable = await checkEmailAvailability(formData.email);
            if (!emailAvailable) {
                setMessage('Email sudah terdaftar atau sedang dalam proses verifikasi. Silakan gunakan email lain.');
                setMessageType('error');
                setIsLoading(false);
                return;
            }

            // Prepare form data for submission
            const submitData = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'confirmPassword') return;
                
                if (key === 'fotoKtp' && formData[key]) {
                    submitData.append('foto_ktp', formData[key]);
                } else if (key !== 'fotoKtp') {
                    // Convert camelCase to snake_case
                    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
                    submitData.append(snakeKey, formData[key]);
                }
            });

            console.log('Submitting to:', `${getApiUrl()}/api/auth/register`);
            
            const response = await axios.post(`${getApiUrl()}/api/auth/register`, submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 30000,
            });

            console.log('Registration response:', response.data);

            setMessage(response.data.message || 'Pendaftaran berhasil! Akun Anda akan diverifikasi oleh admin dalam 1-2 hari kerja.');
            setMessageType('success');
            
            // Reset form
            setFormData({
                email: '',
                password: '',
                confirmPassword: '',
                namaLengkap: '',
                noHp: '',
                jenisKelamin: '',
                dusun: '',
                rt: '',
                rw: '',
                desa: '',
                kecamatan: '',
                kota: '',
                provinsi: '',
                fotoKtp: null
            });
            
            // Reset file input
            const fileInput = document.getElementById('foto_ktp');
            if (fileInput) fileInput.value = '';
            
            setFieldErrors({});

            // Auto redirect after success
            setTimeout(() => {
                navigate('/login', {
                    state: {
                        message: 'Pendaftaran berhasil! Akun Anda sedang dalam proses verifikasi admin.',
                        type: 'info'
                    }
                });
            }, 3000);

        } catch (error) {
            console.error('Registration error:', error);
            
            let errorMessage = 'Terjadi kesalahan saat registrasi. Mohon coba lagi.';
            
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Koneksi timeout. Mohon coba lagi.';
            } else if (error.response?.status === 413) {
                errorMessage = 'File terlalu besar. Maksimal 2MB.';
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
            <div className="auth-container">
                {/* Left Side - Hero Section */}
                <section className="auth-left">
                    <div className="hero-content">
                        <div className="hero-icon">🏍️</div>
                        <h1 className="hero-title">RentalMotor</h1>
                        <p className="hero-subtitle">
                            Bergabunglah dengan komunitas rental motor terpercaya dan nikmati kemudahan sewa motor berkualitas
                        </p>
                        
                        <div className="feature-list">
                            <div className="feature-item">
                                <div className="feature-icon">📝</div>
                                <div className="feature-text">Daftar Mudah</div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">🛡️</div>
                                <div className="feature-text">Data Aman</div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">⚡</div>
                                <div className="feature-text">Verifikasi Cepat</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Right Side - Form Section */}
                <section className="auth-right">
                    <div className="form-container">
                        <div className="form-header">
                            <h1 className="form-title">BUAT AKUN BARU</h1>
                            <h2 className="form-subtitle">DAFTAR AKUN</h2>
                        </div>

                        {/* Debug Info (remove in production) */}
                        {import.meta.env.DEV && (
                            <div style={{ padding: '10px', backgroundColor: '#f0f0f0', marginBottom: '10px', fontSize: '12px' }}>
                                <strong>Debug Info:</strong><br/>
                                API URL: {getApiUrl()}<br/>
                                Form Valid: {isFormValid ? '✓' : '✗'}<br/>
                                Errors: {Object.keys(fieldErrors).length}<br/>
                                All Fields Filled: {isAllFieldsFilled() ? '✓' : '✗'}
                            </div>
                        )}

                        {/* Alert Messages */}
                        {message && (
                            <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'}`}>
                                {message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="register-form">
                            {/* Email */}
                            <div className="input-group">
                                <input 
                                    type="email" 
                                    name="email" 
                                    placeholder="Email" 
                                    className={`form-input full-width ${fieldErrors.email ? 'error' : ''}`}
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />
                                {fieldErrors.email && <span className="error-text">{fieldErrors.email}</span>}
                            </div>
                            
                            {/* Password Fields */}
                            <div className="form-row">
                                <div className="input-group">
                                    <input 
                                        type="password" 
                                        name="password" 
                                        placeholder="Password" 
                                        className={`form-input ${fieldErrors.password ? 'error' : ''}`}
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    {fieldErrors.password && <span className="error-text">{fieldErrors.password}</span>}
                                </div>
                                <div className="input-group">
                                    <input 
                                        type="password" 
                                        name="confirmPassword" 
                                        placeholder="Konfirmasi Password" 
                                        className={`form-input ${fieldErrors.confirmPassword ? 'error' : ''}`}
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    {fieldErrors.confirmPassword && <span className="error-text">{fieldErrors.confirmPassword}</span>}
                                </div>
                            </div>

                            {/* Personal Info */}
                            <div className="input-group">
                                <input 
                                    type="text" 
                                    name="namaLengkap" 
                                    placeholder="Nama Lengkap (sesuai KTP)" 
                                    className={`form-input full-width ${fieldErrors.namaLengkap ? 'error' : ''}`}
                                    value={formData.namaLengkap}
                                    onChange={handleInputChange}
                                    required
                                />
                                {fieldErrors.namaLengkap && <span className="error-text">{fieldErrors.namaLengkap}</span>}
                            </div>
                            
                            <div className="form-row">
                                <div className="input-group">
                                    <input 
                                        type="tel" 
                                        name="noHp" 
                                        placeholder="No. HP (08xxxxxxxxxx)" 
                                        className={`form-input ${fieldErrors.noHp ? 'error' : ''}`}
                                        value={formData.noHp}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    {fieldErrors.noHp && <span className="error-text">{fieldErrors.noHp}</span>}
                                </div>
                                <div className="input-group">
                                    <select 
                                        name="jenisKelamin" 
                                        className={`form-input ${fieldErrors.jenisKelamin ? 'error' : ''}`}
                                        value={formData.jenisKelamin}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Jenis Kelamin</option>
                                        <option value="laki-laki">Laki-laki</option>
                                        <option value="perempuan">Perempuan</option>
                                    </select>
                                    {fieldErrors.jenisKelamin && <span className="error-text">{fieldErrors.jenisKelamin}</span>}
                                </div>
                            </div>
                            
                            {/* Address Section */}
                            <div className="address-section">
                                <h3 className="section-title">Alamat Lengkap</h3>
                                
                                <div className="input-group">
                                    <input 
                                        type="text" 
                                        name="dusun" 
                                        placeholder="Dusun/Jalan" 
                                        className={`form-input full-width ${fieldErrors.dusun ? 'error' : ''}`}
                                        value={formData.dusun}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    {fieldErrors.dusun && <span className="error-text">{fieldErrors.dusun}</span>}
                                </div>
                                
                                <div className="form-row">
                                    <div className="input-group">
                                        <input 
                                            type="text" 
                                            name="rt" 
                                            placeholder="RT" 
                                            className={`form-input ${fieldErrors.rt ? 'error' : ''}`}
                                            value={formData.rt}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        {fieldErrors.rt && <span className="error-text">{fieldErrors.rt}</span>}
                                    </div>
                                    <div className="input-group">
                                        <input 
                                            type="text" 
                                            name="rw" 
                                            placeholder="RW" 
                                            className={`form-input ${fieldErrors.rw ? 'error' : ''}`}
                                            value={formData.rw}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        {fieldErrors.rw && <span className="error-text">{fieldErrors.rw}</span>}
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="input-group">
                                        <select 
                                            name="provinsi" 
                                            className={`form-input ${fieldErrors.provinsi ? 'error' : ''}`}
                                            value={formData.provinsi}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">Pilih Provinsi</option>
                                            {provinces.map(province => (
                                                <option key={province.id} value={province.name}>
                                                    {province.name}
                                                </option>
                                            ))}
                                        </select>
                                        {fieldErrors.provinsi && <span className="error-text">{fieldErrors.provinsi}</span>}
                                    </div>
                                    <div className="input-group">
                                        <select 
                                            name="kota" 
                                            className={`form-input ${fieldErrors.kota ? 'error' : ''}`}
                                            value={formData.kota}
                                            onChange={handleInputChange}
                                            disabled={!cities.length}
                                            required
                                        >
                                            <option value="">Pilih Kota/Kabupaten</option>
                                            {cities.map(city => (
                                                <option key={city.id} value={city.name}>
                                                    {city.name}
                                                </option>
                                            ))}
                                        </select>
                                        {fieldErrors.kota && <span className="error-text">{fieldErrors.kota}</span>}
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="input-group">
                                        <select 
                                            name="kecamatan" 
                                            className={`form-input ${fieldErrors.kecamatan ? 'error' : ''}`}
                                            value={formData.kecamatan}
                                            onChange={handleInputChange}
                                            disabled={!districts.length}
                                            required
                                        >
                                            <option value="">Pilih Kecamatan</option>
                                            {districts.map(district => (
                                                <option key={district.id} value={district.name}>
                                                    {district.name}
                                                </option>
                                            ))}
                                        </select>
                                        {fieldErrors.kecamatan && <span className="error-text">{fieldErrors.kecamatan}</span>}
                                    </div>
                                    <div className="input-group">
                                        <select 
                                            name="desa" 
                                            className={`form-input ${fieldErrors.desa ? 'error' : ''}`}
                                            value={formData.desa}
                                            onChange={handleInputChange}
                                            disabled={!villages.length}
                                            required
                                        >
                                            <option value="">Pilih Desa/Kelurahan</option>
                                            {villages.map(village => (
                                                <option key={village.id} value={village.name}>
                                                    {village.name}
                                                </option>
                                            ))}
                                        </select>
                                        {fieldErrors.desa && <span className="error-text">{fieldErrors.desa}</span>}
                                    </div>
                                </div>

                                <div className="input-group">
                                    <input 
                                        type="file" 
                                        name="fotoKtp"
                                        id="foto_ktp"
                                        accept="image/jpeg,image/jpg,image/png" 
                                        className={`form-input full-width file-input ${fieldErrors.fotoKtp ? 'error' : ''}`}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    <small className="file-help">Format: JPG, JPEG, PNG. Maksimal 2MB</small>
                                    {fieldErrors.fotoKtp && <span className="error-text">{fieldErrors.fotoKtp}</span>}
                                </div>
                            </div>

                            <p className="login-link">
                                Sudah memiliki akun? <Link to="/login">Masuk</Link>
                            </p>
                            
                            <button 
                                type="submit" 
                                className={`btn-register ${isLoading ? 'loading' : ''} ${!isFormValid ? 'disabled' : ''}`}
                                disabled={isLoading}
                                style={{ 
                                    opacity: isLoading ? 0.7 : 1,
                                    cursor: isLoading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isLoading ? 'MENDAFTAR...' : 'DAFTAR SEKARANG ➝'}
                            </button>
                            
                            <p className="terms-text">
                                *) Dengan mengklik tombol di atas, Anda menyetujui{' '}
                                <a href="/terms" target="_blank">Ketentuan Pengguna</a> &{' '}
                                <a href="/privacy" target="_blank">Kebijakan Privasi Kami</a>
                            </p>
                        </form>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Register;