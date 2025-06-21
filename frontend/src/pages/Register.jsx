import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

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
        
        // Validasi langsung
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

            const response = await axios.post(`${getApiUrl()}/api/auth/register`, submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 30000,
            });

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

// Revisi bagian return - ganti dari baris 449 sampai sekitar baris 500

return (
    <div style={{
        margin: 0,
        padding: 0,
        fontFamily: "'Trebuchet MS', sans-serif",
        boxSizing: 'border-box',
        backgroundColor: '#f5f5f5', // Background abu-abu seperti di gambar
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    }}>
        {/* Container Pembungkus Utama - Seperti di gambar */}
        <div style={{
            width: '90%',
            maxWidth: '1200px',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            display: 'flex',
            minHeight: '600px'
        }}>
            {/* Left Side - Images */}
            <div style={{
                width: '50%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#1A35B5',
                padding: '40px',
                position: 'relative'
            }}>
                {/* Logo/Gambar Motor */}
                <div style={{
                    width: '100%',
                    height: '300px',
                    backgroundImage: 'url(public/images/imageLogin.jpg)',
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    marginBottom: '40px'
                }}>
                    {/* Fallback jika gambar tidak ada */}
                    <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '72px'
                    }}>🏍️</div>
                </div>

                {/* Title */}
                <h1 style={{
                    color: '#ffffff',
                    fontSize: '36px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    margin: '0 0 20px 0'
                }}>RentalMotor</h1>

                <p style={{
                    color: '#ffffff',
                    fontSize: '16px',
                    textAlign: 'center',
                    lineHeight: '1.6',
                    opacity: 0.9
                }}>
                    Solusi terbaik untuk kebutuhan rental motor Anda 
                    dengan layanan terpercaya dan kualitas terjamin
                </p>

                {/* Feature Icons */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    width: '100%',
                    marginTop: '40px'
                }}>
                    <div style={{
                        textAlign: 'center',
                        color: '#ffffff'
                    }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            margin: '0 auto 10px'
                        }}>⚡</div>
                        <p style={{ fontSize: '12px', margin: 0 }}>Proses Cepat</p>
                    </div>
                    <div style={{
                        textAlign: 'center',
                        color: '#ffffff'
                    }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            margin: '0 auto 10px'
                        }}>🛡️</div>
                        <p style={{ fontSize: '12px', margin: 0 }}>Aman Terpercaya</p>
                    </div>
                    <div style={{
                        textAlign: 'center',
                        color: '#ffffff'
                    }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            margin: '0 auto 10px'
                        }}>💰</div>
                        <p style={{ fontSize: '12px', margin: 0 }}>Harga Terjangkau</p>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div style={{
                width: '50%',
                padding: '40px',
                backgroundColor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: '400px',
                    margin: '0 auto'
                }}>
                    {/* Header */}
                    <div style={{ marginBottom: '30px' }}>
                        <h1 style={{
                            color: '#1A35B5',
                            fontFamily: "'Trebuchet MS', sans-serif",
                            fontSize: '18px',
                            margin: '0 0 5px 0'
                        }}>BUAT AKUN BARU</h1>
                        <h2 style={{
                            fontSize: '28px',
                            fontWeight: 'bold',
                            fontFamily: "'Trebuchet MS', sans-serif",
                            color: '#000',
                            margin: '0 0 16px 0'
                        }}>DAFTAR AKUN</h2>
                    </div>

                    {/* Error Message */}
                    {message && (
                        <div style={{
                            color: messageType === 'error' ? '#ff0000' : '#00A200',
                            textAlign: 'center',
                            margin: '0 0 20px 0',
                            fontWeight: 'bold',
                            padding: '10px',
                            borderRadius: '6px',
                            backgroundColor: messageType === 'error' ? '#ffe6e6' : '#e6ffe6'
                        }}>
                            {message}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px'
                    }}>
                        {/* Email */}
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            style={{
                                height: '45px',
                                padding: '8px 12px',
                                border: fieldErrors.email ? '1px solid #ff0000' : '1px solid rgba(0, 0, 0, 0.1)',
                                borderRadius: '6px',
                                fontSize: '14px',
                                width: '100%',
                                boxSizing: 'border-box'
                            }}
                        />
                        {fieldErrors.email && (
                            <span style={{ color: '#ff0000', fontSize: '12px' }}>
                                {fieldErrors.email}
                            </span>
                        )}

                        {/* Nama dan Jenis Kelamin */}
                        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                name="namaLengkap"
                                placeholder="Nama Lengkap"
                                value={formData.namaLengkap}
                                onChange={handleInputChange}
                                disabled={isLoading}
                                style={{
                                    height: '45px',
                                    padding: '8px 12px',
                                    border: fieldErrors.namaLengkap ? '1px solid #ff0000' : '1px solid rgba(0, 0, 0, 0.1)',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    flex: 1,
                                    minWidth: '48%',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <select
                                name="jenisKelamin"
                                value={formData.jenisKelamin}
                                onChange={handleInputChange}
                                disabled={isLoading}
                                style={{
                                    height: '45px',
                                    padding: '8px 12px',
                                    border: fieldErrors.jenisKelamin ? '1px solid #ff0000' : '1px solid rgba(0, 0, 0, 0.1)',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    flex: 1,
                                    minWidth: '48%',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <option value="">Jenis Kelamin</option>
                                <option value="laki-laki">Laki-laki</option>
                                <option value="perempuan">Perempuan</option>
                            </select>
                        </div>

                        {/* No HP */}
                        <input
                            type="tel"
                            name="noHp"
                            placeholder="No Telp"
                            value={formData.noHp}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            style={{
                                height: '45px',
                                padding: '8px 12px',
                                border: fieldErrors.noHp ? '1px solid #ff0000' : '1px solid rgba(0, 0, 0, 0.1)',
                                borderRadius: '6px',
                                fontSize: '14px',
                                width: '100%',
                                boxSizing: 'border-box'
                            }}
                        />

                        {/* Password dan Konfirmasi */}
                        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                            <input
                                type="password"
                                name="password"
                                placeholder="Kata Sandi"
                                value={formData.password}
                                onChange={handleInputChange}
                                disabled={isLoading}
                                style={{
                                    height: '45px',
                                    padding: '8px 12px',
                                    border: fieldErrors.password ? '1px solid #ff0000' : '1px solid rgba(0, 0, 0, 0.1)',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    flex: 1,
                                    minWidth: '48%',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Konfirmasi Kata Sandi"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                disabled={isLoading}
                                style={{
                                    height: '45px',
                                    padding: '8px 12px',
                                    border: fieldErrors.confirmPassword ? '1px solid #ff0000' : '1px solid rgba(0, 0, 0, 0.1)',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    flex: 1,
                                    minWidth: '48%',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Alamat Section */}
                        <div>
                            <h3 style={{
                                fontSize: '18px',
                                fontWeight: 'bold',
                                fontFamily: "'Trebuchet MS', sans-serif",
                                marginBottom: '8px',
                                color: '#000',
                                marginTop: '20px'
                            }}>Alamat</h3>

                            {/* Dusun/Jalan */}
                            <input
                                type="text"
                                name="dusun"
                                placeholder="Dusun/Jalan"
                                value={formData.dusun}
                                onChange={handleInputChange}
                                disabled={isLoading}
                                style={{
                                    height: '45px',
                                    padding: '8px 12px',
                                    border: fieldErrors.dusun ? '1px solid #ff0000' : '1px solid rgba(0, 0, 0, 0.1)',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    marginBottom: '14px'
                                }}
                            />

                            {/* Provinsi dan Kota */}
                            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '14px' }}>
                                <select
                                    name="provinsi"
                                    value={formData.provinsi}
                                    onChange={handleInputChange}
                                    disabled={isLoading}
                                    style={{
                                        height: '45px',
                                        padding: '8px 12px',
                                        border: fieldErrors.provinsi ? '1px solid #ff0000' : '1px solid rgba(0, 0, 0, 0.1)',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        flex: 1,
                                        minWidth: '48%',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    <option value="">Pilih Provinsi</option>
                                    {provinces.map(province => (
                                        <option key={province.id} value={province.name}>
                                            {province.name}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    name="kota"
                                    value={formData.kota}
                                    onChange={handleInputChange}
                                    disabled={!cities.length || isLoading}
                                    style={{
                                        height: '45px',
                                        padding: '8px 12px',
                                        border: fieldErrors.kota ? '1px solid #ff0000' : '1px solid rgba(0, 0, 0, 0.1)',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        flex: 1,
                                        minWidth: '48%',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    <option value="">Pilih Kota/Kabupaten</option>
                                    {cities.map(city => (
                                        <option key={city.id} value={city.name}>
                                            {city.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Kecamatan dan Desa */}
                            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '14px' }}>
                                <select
                                    name="kecamatan"
                                    value={formData.kecamatan}
                                    onChange={handleInputChange}
                                    disabled={!districts.length || isLoading}
                                    style={{
                                        height: '45px',
                                        padding: '8px 12px',
                                        border: fieldErrors.kecamatan ? '1px solid #ff0000' : '1px solid rgba(0, 0, 0, 0.1)',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        flex: 1,
                                        minWidth: '48%',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    <option value="">Pilih Kecamatan</option>
                                    {districts.map(district => (
                                        <option key={district.id} value={district.name}>
                                            {district.name}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    name="desa"
                                    value={formData.desa}
                                    onChange={handleInputChange}
                                    disabled={!villages.length || isLoading}
                                    style={{
                                        height: '45px',
                                        padding: '8px 12px',
                                        border: fieldErrors.desa ? '1px solid #ff0000' : '1px solid rgba(0, 0, 0, 0.1)',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        flex: 1,
                                        minWidth: '48%',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    <option value="">Pilih Desa/Kelurahan</option>
                                    {villages.map(village => (
                                        <option key={village.id} value={village.name}>
                                            {village.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* RT dan RW */}
                            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    name="rt"
                                    placeholder="RT"
                                    value={formData.rt}
                                    onChange={handleInputChange}
                                    disabled={isLoading}
                                    style={{
                                        height: '45px',
                                        padding: '8px 12px',
                                        border: fieldErrors.rt ? '1px solid #ff0000' : '1px solid rgba(0, 0, 0, 0.1)',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        flex: 1,
                                        minWidth: '48%',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                <input
                                    type="text"
                                    name="rw"
                                    placeholder="RW"
                                    value={formData.rw}
                                    onChange={handleInputChange}
                                    disabled={isLoading}
                                    style={{
                                        height: '45px',
                                        padding: '8px 12px',
                                        border: fieldErrors.rw ? '1px solid #ff0000' : '1px solid rgba(0, 0, 0, 0.1)',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        flex: 1,
                                        minWidth: '48%',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Upload Foto KTP */}
                        <div style={{ marginTop: '20px' }}>
                            <label style={{
                                fontSize: '14px',
                                fontWeight: 'bold',
                                marginBottom: '8px',
                                display: 'block',
                                color: '#000'
                            }}>
                                Upload Foto KTP
                            </label>
                            <input
                                type="file"
                                name="fotoKtp"
                                accept="image/jpeg,image/jpg,image/png"
                                onChange={handleInputChange}
                                disabled={isLoading}
                                style={{
                                    height: '45px',
                                    padding: '8px 12px',
                                    border: fieldErrors.fotoKtp ? '1px solid #ff0000' : '1px solid rgba(0, 0, 0, 0.1)',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}
                            />
                            {fieldErrors.fotoKtp && (
                                <span style={{ color: '#ff0000', fontSize: '12px' }}>
                                    {fieldErrors.fotoKtp}
                                </span>
                            )}
                        </div>

                        {/* Error untuk field lainnya */}
                        {Object.keys(fieldErrors).map(field => {
                            if (['email', 'password', 'confirmPassword', 'noHp', 'fotoKtp'].includes(field)) return null;
                            return (
                                <span key={field} style={{ color: '#ff0000', fontSize: '12px' }}>
                                    {fieldErrors[field]}
                                </span>
                            );
                        })}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!isFormValid || isLoading}
                            style={{
                                height: '50px',
                                background: isFormValid && !isLoading 
                                    ? 'linear-gradient(90deg, #4CEA53 0%, #00A100 100%)' 
                                    : '#cccccc',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: isFormValid && !isLoading ? 'pointer' : 'not-allowed',
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                marginTop: '20px'
                            }}
                        >
                            {isLoading ? 'Mendaftar...' : 'DAFTAR'}
                        </button>

                        {/* Login Link */}
                        <div style={{
                            textAlign: 'center',
                            marginTop: '20px'
                        }}>
                            <span style={{ fontSize: '14px', color: '#666' }}>
                                Sudah punya akun? 
                                <Link 
                                    to="/login" 
                                    style={{ 
                                        color: '#1A35B5', 
                                        textDecoration: 'none',
                                        fontWeight: 'bold',
                                        marginLeft: '5px'
                                    }}
                                >
                                    Login di sini
                                </Link>
                            </span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
);

}

export default Register;