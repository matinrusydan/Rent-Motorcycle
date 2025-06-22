// frontend/src/pages/Index.jsx

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import MotorCard from '../components/MotorCard.jsx';
import MotorAvailabilityCalendar from '../components/MotorAvailabilityCalendar.jsx'; 

// CSS yang relevan
import '../assets/css/style.css';
import '../assets/css/global.css';
import '../assets/css/motor-calendar.css'; 

// Component untuk menampilkan testimoni
const TestimonialItem = ({ avatarInitials, name, rating, date, text }) => {
    return (
        <div className="comment-item">
            <div className="comment-header">
                <div className="comment-avatar">{avatarInitials}</div>
                <div className="comment-info">
                    <h4>{name}</h4>
                    <div className="comment-rating">{rating}</div>
                    <span className="comment-date">{date}</span>
                </div>
            </div>
            <div className="comment-text">{text}</div>
        </div>
    );
};

const Index = () => {
    const [allMotors, setAllMotors] = useState([]);
    const [motorBrands, setMotorBrands] = useState([]);
    const [allTestimonials, setAllTestimonials] = useState([]);
    const [showAllBrands, setShowAllBrands] = useState(false);
    const [brandSliders, setBrandSliders] = useState({});

    const [loadingMotors, setLoadingMotors] = useState(true);
    const [loadingTestimonials, setLoadingTestimonials] = useState(true);
    const [error, setError] = useState(null);
    const [submitReservationLoading, setSubmitReservationLoading] = useState(false);
    const [submitTestimonialLoading, setSubmitTestimonialLoading] = useState(false);

    const [reservasiPopupOpen, setReservasiPopupOpen] = useState(false);
    const [selectedMerk, setSelectedMerk] = useState('');
    const [availableTipeMotor, setAvailableTipeMotor] = useState([]);
    const [currentTipeMotor, setCurrentTipeMotor] = useState('');
    const [tanggalSewaInput, setTanggalSewaInput] = useState(''); 
    const [lamaSewaInput, setLamaSewaInput] = useState(''); 
    const [availableMotorsFilteredByDate, setAvailableMotorsFilteredByDate] = useState([]); 
    const [selectedMotorForCalendar, setSelectedMotorForCalendar] = useState(null); 

    const [commentText, setCommentText] = useState('');
    const [rating, setRating] = useState(0);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    const [currentUser, setCurrentUser] = useState(null);

    // FIXED: Ref untuk mencegah multiple API calls
    const isFilteringByDate = useRef(false);

    const navigate = useNavigate();

    const getApiUrl = () => {
        return import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';
    };

    const debugUserData = () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                JSON.parse(userStr);
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
    };

    const getCurrentUser = useCallback(() => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                return null;
            }
            const user = JSON.parse(userStr);
            debugUserData();
            const normalizedUser = {
                ...user,
                nama_lengkap: user.nama_lengkap || user.name || user.full_name || '',
                no_hp: user.no_hp || user.phone || user.phone_number || user.nomor_hp || '',
                id: user.id
            };
            setCurrentUser(normalizedUser);
            return normalizedUser;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    }, []);

    // Mengambil motor yang tersedia secara umum (untuk slider utama)
    const fetchAllMotorsForSliders = useCallback(async () => {
        setLoadingMotors(true);
        try {
            const response = await axios.get(`${getApiUrl()}/api/motors/available`);
            const motors = response.data.data;
            setAllMotors(motors); 

            const brands = [...new Set(motors.map(m => m.brand))];
            setMotorBrands(brands.filter(b => b));

            const sliderStates = {};
            brands.forEach(brand => {
                const brandMotors = motors.filter(m => m.brand === brand && m.status === 'available');
                const totalSlides = Math.ceil(brandMotors.length / 3);
                sliderStates[brand] = { currentSlide: 0, totalSlides: Math.max(1, totalSlides), motorsPerSlide: 3 };
            });
            setBrandSliders(sliderStates);

        } catch (err) {
            console.error('Error fetching all motors for sliders:', err);
            setError(`Gagal memuat daftar motor: ${err.message}`);
            setAllMotors([]);
            setMotorBrands([]);
        } finally {
            setLoadingMotors(false);
        }
    }, []);

    
    // FIXED: Mengambil motor yang tersedia berdasarkan filter tanggal
    const fetchFilteredMotorsByDate = useCallback(async (motorId, tanggalMulai, lamaSewa) => {
        if (!motorId || !tanggalMulai || !lamaSewa) { // Ensure all necessary params are present
            setAvailableMotorsFilteredByDate([]);
            setSelectedMerk('');
            setAvailableTipeMotor([]);
            setCurrentTipeMotor('');
            return;
        }

        if (isFilteringByDate.current) {
            return;
        }
        isFilteringByDate.current = true;
        
        try {
            const url = `${getApiUrl()}/api/motors/available`;
            const params = new URLSearchParams({
                motor_id: motorId,
                tanggal_mulai: tanggalMulai,
                lama_sewa: lamaSewa
            });

            const response = await axios.get(`${url}?${params.toString()}`);
            const motors = response.data.data;
            setAvailableMotorsFilteredByDate(motors);
            
            const chosenMotor = motors.find(m => m.id === motorId);
            if(chosenMotor) {
                setSelectedMerk(chosenMotor.brand);
                setCurrentTipeMotor(chosenMotor.type);
                const motorOfType = motors.filter(m => m.brand === chosenMotor.brand);
                const uniqueTypes = [...new Set(motorOfType.map(m => m.type))];
                setAvailableTipeMotor(uniqueTypes.filter(t => t));
            } else {
                // If the selected motor is not available for the chosen dates, clear selection
                setSelectedMerk('');
                setAvailableTipeMotor([]);
                setCurrentTipeMotor('');
                // Optionally, show a message to the user that the selected motor is not available for these dates
            }

        } catch (err) {
            console.error('Error fetching filtered motors by date:', err);
            setError(`Gagal memuat motor untuk tanggal yang dipilih: ${err.message}`);
            setAvailableMotorsFilteredByDate([]);
            setSelectedMerk('');
            setAvailableTipeMotor([]);
            setCurrentTipeMotor('');
        } finally {
            isFilteringByDate.current = false;
        }
    }, []);

    const fetchPublicTestimonials = useCallback(async () => {
        setLoadingTestimonials(true);
        try {
            const response = await axios.get(`${getApiUrl()}/api/testimonials/approved`);
            setAllTestimonials(response.data.data);
        } catch (err) {
            console.error('Error fetching public testimonials:', err);
            setError(`Gagal memuat testimoni: ${err.message}`);
            setAllTestimonials([]);
        } finally {
            setLoadingTestimonials(false);
        }
    }, []);

    const fetchUserProfile = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return null;
            const response = await axios.get(`${getApiUrl()}/api/auth/profile`, { headers: { Authorization: `Bearer ${token}` } });
            const userData = response.data;
            localStorage.setItem('user', JSON.stringify(userData));
            setCurrentUser(userData);
            return userData;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return getCurrentUser();
        }
    }, [getCurrentUser]);

    useEffect(() => {
        fetchAllMotorsForSliders();
        fetchPublicTestimonials();
        fetchUserProfile().then(user => { if (!user) { getCurrentUser(); } });
    }, [fetchAllMotorsForSliders, fetchPublicTestimonials, fetchUserProfile, getCurrentUser]);

    // FIXED: Hapus useEffect yang menyebabkan refresh berulang
    // useEffect untuk memfilter motor berdasarkan tanggal dan lama sewa sudah tidak diperlukan
    // karena filtering akan dilakukan langsung di handleCalendarDateSelect

    // --- SLIDER FUNCTIONS ---
    const nextSlide = (brand) => {
        setBrandSliders(prev => {
            const current = prev[brand];
            if (current && current.currentSlide < current.totalSlides - 1) {
                return { ...prev, [brand]: { ...current, currentSlide: current.currentSlide + 1 } };
            } return prev;
        });
    };

    const prevSlide = (brand) => {
        setBrandSliders(prev => {
            const current = prev[brand];
            if (current && current.currentSlide > 0) {
                return { ...prev, [brand]: { ...current, currentSlide: current.currentSlide - 1 } };
            } return prev;
        });
    };

    const goToSlide = (brand, slideIndex) => {
        setBrandSliders(prev => ({ ...prev, [brand]: { ...prev[brand], currentSlide: slideIndex } }));
    };

    // Get motors for specific brand and slide
    const getMotorsForBrandSlide = (brand, slideIndex) => {
        const motorsToDisplay = allMotors;
        const brandMotors = motorsToDisplay.filter(m => m.brand === brand && m.status === 'available');
        const startIndex = slideIndex * 3;
        const endIndex = startIndex + 3;
        return brandMotors.slice(startIndex, endIndex);
    };

    // --- FUNGSI FORM RESERVASI ---
    const openReservasiPopup = useCallback((merk = '', tipe = '', motorId = null) => {
        const user = getCurrentUser();
        if (!user || !user.id) {
            alert('Anda harus login untuk membuat reservasi.');
            navigate('/login');
            return;
        }

        setReservasiPopupOpen(true);
        document.body.style.overflow = 'hidden';
        
        // Set motor untuk kalender
        setSelectedMotorForCalendar(motorId);
        
        // Reset form fields
        setTanggalSewaInput('');
        setLamaSewaInput('');
        setAvailableMotorsFilteredByDate([]); // Clear previous filtered motors
        setSelectedMerk('');
        setAvailableTipeMotor([]);
        setCurrentTipeMotor('');

        // Pre-populate if a specific motor was clicked
        if (motorId) {
            const motorData = allMotors.find(m => m.id === motorId);
            if (motorData) {
                setSelectedMerk(motorData.brand);
                setCurrentTipeMotor(motorData.type);
                // When a motor is pre-selected, populate available types with ALL types of that brand initially
                const brandMotors = allMotors.filter(m => m.brand === motorData.brand);
                const uniqueTypes = [...new Set(brandMotors.map(m => m.type))];
                setAvailableTipeMotor(uniqueTypes.filter(t => t));
            }
        }
        // No need for 'else' as defaults are set above
    }, [allMotors, getCurrentUser, navigate]);

    const closeReservasiPopup = () => {
        setReservasiPopupOpen(false);
        document.body.style.overflow = 'auto';
        setSelectedMerk('');
        setAvailableTipeMotor([]);
        setCurrentTipeMotor('');
        setError(null);
        setTanggalSewaInput('');
        setLamaSewaInput('');
        setSelectedMotorForCalendar(null);
        setAvailableMotorsFilteredByDate([]);
    };

    // FIXED: Handler ketika tanggal dipilih dari kalender - tidak menyebabkan refresh berulang
    const handleCalendarDateSelect = useCallback((selection) => {
        if (selection) {
            const formattedStartDate = selection.startDate; // Already YYYY-MM-DD from MotorAvailabilityCalendar
            const duration = selection.duration.toString();

            setTanggalSewaInput(formattedStartDate);
            setLamaSewaInput(duration);
            
            // Trigger fetching available motors for the selected range and motor
            if (selectedMotorForCalendar) {
                fetchFilteredMotorsByDate(selectedMotorForCalendar, formattedStartDate, duration);
            }
        } else {
            // Reset all fields if selection is cleared
            setTanggalSewaInput('');
            setLamaSewaInput('');
            setAvailableMotorsFilteredByDate([]);
            setSelectedMerk('');
            setAvailableTipeMotor([]);
            setCurrentTipeMotor('');
        }
    }, [selectedMotorForCalendar, fetchFilteredMotorsByDate]);

    const handleMerkChange = (e) => {
        const merk = e.target.value;
        setSelectedMerk(merk);
        // Filter types based on the currently selected brand and the motors that are available for the *selected dates*
        const motorOfType = availableMotorsFilteredByDate.filter(m => m.brand === merk);
        const uniqueTypes = [...new Set(motorOfType.map(m => m.type))];
        setAvailableTipeMotor(uniqueTypes.filter(t => t));
        setCurrentTipeMotor(''); // Reset type when brand changes
    };

// Fixed handleReservasiSubmit function
const handleReservasiSubmit = async (e) => {
        e.preventDefault();
        setSubmitReservationLoading(true);
        setError(null);
        
        const data = new FormData(e.target); // Use FormData to get values from name attributes

        console.log('=== DEBUG RESERVATION SUBMISSION ===');
        console.log('Current selected motor ID:', selectedMotorForCalendar);
        console.log('Tanggal Sewa Input (from state):', tanggalSewaInput);
        console.log('Lama Sewa Input (from state):', lamaSewaInput);
        console.log('Lokasi Jemput (from form data):', data.get('lokasi_jemput'));
        console.log('Catatan (from form data):', data.get('catatanReservasi'));
        console.log('Current User:', currentUser);

        const namaLengkap = currentUser?.nama_lengkap;
        const noHp = currentUser?.no_hp;
        const userId = currentUser?.id;
        
        // 1. Basic field validation
        if (!selectedMotorForCalendar || !tanggalSewaInput || !lamaSewaInput || !data.get('lokasi_jemput')) {
            setError('Mohon lengkapi semua field yang diperlukan (Motor, Tanggal, Lama Sewa, Lokasi Jemput).');
            setSubmitReservationLoading(false);
            return;
        }

        // 2. User profile validation
        if (!namaLengkap || !noHp || !userId) {
            setError('Data profil Anda tidak lengkap. Silakan lengkapi profil Anda terlebih dahulu atau login ulang.');
            setSubmitReservationLoading(false);
            navigate('/login');
            return;
        }

        // 3. Lama sewa validation
        const lamaSewa = parseInt(lamaSewaInput); // Get from state, not form data
        if (isNaN(lamaSewa) || lamaSewa <= 0) {
            setError('Lama sewa harus berupa angka yang valid (minimal 1 hari).');
            setSubmitReservationLoading(false);
            return;
        }

        // 4. Find the selected motor details using selectedMotorForCalendar
        const motorIdNumber = parseInt(selectedMotorForCalendar);
        let selectedMotorDetails = allMotors.find(m => m.id === motorIdNumber);

        if (!selectedMotorDetails) {
            setError('Motor yang dipilih tidak ditemukan. Silakan pilih motor lain.');
            setSubmitReservationLoading(false);
            return;
        }
        
        const motorPriceNumber = parseFloat(selectedMotorDetails.price);
        if (isNaN(motorPriceNumber) || motorPriceNumber <= 0) {
            setError('Harga motor tidak valid. Silakan pilih motor lain atau hubungi admin.');
            setSubmitReservationLoading(false);
            return;
        }

        // Calculate total price
        const calculatedTotalHarga = motorPriceNumber * lamaSewa;
        if (isNaN(calculatedTotalHarga) || calculatedTotalHarga <= 0) {
            setError('Total harga tidak dapat dihitung. Silakan periksa data motor dan lama sewa.');
            setSubmitReservationLoading(false);
            return;
        }

        // Date calculations
        const tanggalMulaiDateObj = new Date(tanggalSewaInput); // Use value from state
        if (isNaN(tanggalMulaiDateObj.getTime())) {
            setError('Tanggal sewa tidak valid. Silakan pilih tanggal yang benar dari kalender.');
            setSubmitReservationLoading(false);
            return;
        }

        const tanggalSelesaiDateObj = new Date(tanggalMulaiDateObj);
        tanggalSelesaiDateObj.setDate(tanggalSelesaiDateObj.getDate() + lamaSewa);

        const tanggalMulaiFormatted = tanggalMulaiDateObj.toISOString().split('T')[0];
        const tanggalSelesaiFormatted = tanggalSelesaiDateObj.toISOString().split('T')[0];

        // Prepare payload
        const payload = {
            user_id: userId,
            motor_id: motorIdNumber,
            tanggal_mulai: tanggalMulaiFormatted,
            tanggal_selesai: tanggalSelesaiFormatted,
            lama_sewa: lamaSewa,
            lokasi_jemput: data.get('lokasi_jemput').trim(),
            total_harga: calculatedTotalHarga,
            catatan: data.get('catatanReservasi')?.trim() || null
        };
        
        console.log('Final payload to send:', payload);

        // Token validation
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Anda harus login untuk membuat reservasi.');
            navigate('/login');
            setSubmitReservationLoading(false);
            return;
        }
        
        try {
            const response = await axios.post(`${getApiUrl()}/api/reservations`, payload, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Success response:', response.data);
            alert(response.data.message || 'Reservasi berhasil dibuat!');
            
            const reservationId = response.data.reservationId || response.data.data?.id || response.data.id;
            const totalHargaReservasi = calculatedTotalHarga;

            closeReservasiPopup(); 
            
            navigate('/pembayaran', { 
                state: { 
                    reservationId: reservationId, 
                    totalHarga: totalHargaReservasi,
                    reservasiData: payload
                } 
            });
            
        } catch (err) {
            console.error('=== ERROR DETAILS ===');
            console.error('Full error object:', err);
            console.error('Error message:', err.message);
            console.error('Error response status:', err.response?.status);
            console.error('Error response data:', err.response?.data);
            
            let errorMessage = 'Gagal membuat reservasi: ';
            if (err.response?.data?.message) {
                errorMessage += err.response.data.message;
            } else if (err.response?.data?.error) {
                errorMessage += err.response.data.error;
            } else if (err.response?.data) {
                errorMessage += JSON.stringify(err.response.data);
            } else {
                errorMessage += err.message;
            }
            
            setError(errorMessage);
            if (err.response?.status === 401) {
                navigate('/login'); // Redirect to login on unauthorized
            }
        } finally {
            setSubmitReservationLoading(false);
        }
    };


    // --- FUNGSI FORM TESTIMONI ---
    const handleCommentChange = (e) => {
        setCommentText(e.target.value);
    };

    const handleRatingChange = (e) => {
        setRating(parseInt(e.target.value));
    };

    const handleSubmitTestimonial = async () => {
        setSubmitTestimonialLoading(true);
        setError(null);

        if (!commentText.trim() || rating === 0) {
            setError('Mohon isi testimoni dan berikan rating!');
            setSubmitTestimonialLoading(false);
            return;
        }

        const token = localStorage.getItem('token');
        const userId = currentUser?.id;

        if (!token || !userId) {
            alert('Anda harus login untuk mengirim testimoni.');
            navigate('/login');
            setSubmitTestimonialLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${getApiUrl()}/api/testimonials`, {
                user_id: userId,
                content: commentText,
                rating: rating
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert(response.data.message || 'Testimoni berhasil dikirim!');
            setShowSuccessMessage(true);
            setCommentText('');
            setRating(0);
            document.querySelectorAll('input[name="rating"]').forEach(radio => radio.checked = false);
        } catch (err) {
            console.error('Error submitting testimonial:', err);
            setError(`Gagal mengirim testimoni: ${err.response?.data?.message || err.message}`);
        } finally {
            setSubmitTestimonialLoading(false);
        }
    };

    const resetTestimonialForm = () => {
        setCommentText('');
        setRating(0);
        setShowSuccessMessage(false);
    };

    // --- FUNGSI UTILITY ---
    const getUniqueBrands = useCallback(() => {
        const brands = [...new Set(allMotors.map(motor => motor.brand))];
        return brands.filter(brand => brand);
    }, [allMotors]);

    const formatPrice = (price) => {
        return `Rp ${parseFloat(price).toLocaleString('id-ID')}/hari`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Get displayed brands (first 3 or all if showAllBrands is true)
    const getDisplayedBrands = () => {
        return showAllBrands ? motorBrands : motorBrands.slice(0, 3);
    };

    if (loadingMotors || loadingTestimonials) {
        return (
            <>
                <Header />
                <div className="loading-container">
                    <div className="loading-spinner">⏳</div>
                    <p>Memuat data...</p>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header /> 

            {/* Hero Section */}
            <section id="beranda" className="hero">
                <div className="container">
                    <div className="hero-content">
                        <h1>Sewa Motor Mudah & Terpercaya</h1>
                        <p>Nikmati perjalanan Anda dengan koleksi motor berkualitas dan pelayanan terbaik. Proses cepat, harga terjangkau!</p>
                        <button className="btn-primary" onClick={() => openReservasiPopup()}>Reservasi Sekarang</button>
                    </div>
                    <div className="hero-image">
                        <img src="/images/imageLogin.jpg" alt="Motor Hero" />
                    </div>
                </div>
            </section>

            {/* Motor Section */}
            <section id="motor" className="motor-section">
                <div className="container">
                    <h2>Motor Tersedia</h2>
                    <div className="motor-categories">
                        {error && (
                            <div className="error-alert">
                                <span className="error-icon">⚠️</span>
                                {error}
                                <button className="error-close" onClick={() => setError(null)}>✖️</button>
                            </div>
                        )}
                        
                        {/* Render motor brands with slider functionality */}
                        {getDisplayedBrands().map(brand => {
                            const brandMotors = allMotors.filter(m => m.brand === brand && m.status === 'available');
                            const sliderState = brandSliders[brand];
                            
                            if (brandMotors.length === 0) return null;
                            
                            return (
                                <div className="category" key={brand}>
                                    <h3>{brand}</h3>
                                    <div className="motor-slider-container">
                                        <div className="motor-slider-wrapper">
                                            <div 
                                                className="motor-slider"
                                                style={{
                                                    transform: `translateX(-${(sliderState?.currentSlide || 0) * 100}%)`,
                                                    transition: 'transform 0.3s ease'
                                                }}
                                            >
                                                {Array.from({ length: sliderState?.totalSlides || 1 }, (_, slideIndex) => (
                                                    <div key={slideIndex} className="motor-slide">
                                                        <div className="motor-grid">
                                                            {getMotorsForBrandSlide(brand, slideIndex).map(motor => (
                                                                <MotorCard 
                                                                    key={motor.id}
                                                                    motorId={motor.id} 
                                                                    brand={motor.brand} 
                                                                    type={motor.type} 
                                                                    price={formatPrice(motor.price)}
                                                                    specs={motor.specs}
                                                                    gambar_motor={motor.gambar_motor}
                                                                    openReservasiPopup={() => openReservasiPopup(motor.brand, motor.type, motor.id)} 
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* Slider Controls */}
                                        {sliderState && sliderState.totalSlides > 1 && (
                                            <>
                                                <button 
                                                    className="slider-btn prev-btn"
                                                    onClick={() => prevSlide(brand)}
                                                    disabled={sliderState.currentSlide === 0}
                                                >
                                                    ❮
                                                </button>
                                                <button 
                                                    className="slider-btn next-btn"
                                                    onClick={() => nextSlide(brand)}
                                                    disabled={sliderState.currentSlide === sliderState.totalSlides - 1}
                                                >
                                                    ❯
                                                </button>
                                                
                                                {/* Dots indicator */}
                                                <div className="slider-dots">
                                                    {Array.from({ length: sliderState.totalSlides }, (_, index) => (
                                                        <button
                                                            key={index}
                                                            className={`slider-dot ${index === sliderState.currentSlide ? 'active' : ''}`}
                                                            onClick={() => goToSlide(brand, index)}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* Show More/Less Button */}
                        {motorBrands.length > 3 && (
                            <div className="show-more-container">
                                <button 
                                    className="btn-show-more"
                                    onClick={() => setShowAllBrands(!showAllBrands)}
                                >
                                    {showAllBrands ? 'Tampilkan Lebih Sedikit' : 'Tampilkan Lebih Banyak'}
                                    <span className="dropdown-icon">{showAllBrands ? '▲' : '▼'}</span>
                                </button>
                            </div>
                        )}
                        
                        {allMotors.length === 0 && !loadingMotors && (
                            <div className="empty-state">
                                <div className="empty-icon">🏍️</div>
                                <h3>Tidak ada motor ditemukan</h3>
                                <p>Silakan kembali nanti atau hubungi admin.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Form Testimoni Section */}
            <section className="form-testimoni-section">
                <div className="container">
                    <h2>Bagikan Pengalaman Anda</h2>
                    <p className="section-subtitle">Ceritakan pengalaman Anda menggunakan layanan rental motor kami</p>
                    
                    {error && submitTestimonialLoading && (
                         <div className="error-alert">
                            <span className="error-icon">⚠️</span>
                            {error}
                            <button className="error-close" onClick={() => setError(null)}>✖️</button>
                        </div>
                    )}

                    {!showSuccessMessage ? (
                        <div className="comment-form-wrapper" id="commentForm">
                            <div className="user-info">
                                <div className="user-avatar">
                                    {currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('') : 'US'}
                                </div>
                                <div className="user-details">
                                    <h4>{currentUser?.name || 'Nama Pengguna'}</h4>
                                    <p>{currentUser?.email || 'email@example.com'}</p>
                                </div>
                            </div>
                            
                            <div className="rating-section">
                                <label className="rating-label">Berikan rating Anda</label>
                                <div className="star-rating">
                                    {[5, 4, 3, 2, 1].map((star) => (
                                        <React.Fragment key={star}>
                                            <input
                                                type="radio"
                                                name="rating"
                                                value={star}
                                                id={`star${star}`}
                                                checked={rating === star}
                                                onChange={handleRatingChange}
                                                disabled={submitTestimonialLoading}
                                            />
                                            <label htmlFor={`star${star}`}>★</label>
                                        </React.Fragment>
                                    ))}
                                    <span className="rating-text">
                                        {rating === 0 && 'Pilih rating Anda'}
                                        {rating === 1 && 'Sangat Buruk'}
                                        {rating === 2 && 'Buruk'}
                                        {rating === 3 && 'Cukup Baik'}
                                        {rating === 4 && 'Baik'}
                                        {rating === 5 && 'Sangat Baik'}
                                    </span>
                                </div>
                            </div>
                            
                            <textarea 
                                className="comment-input" 
                                id="commentText"
                                placeholder="Tulis pengalaman Anda menggunakan layanan rental motor kami..."
                                maxLength="500"
                                value={commentText}
                                onChange={handleCommentChange}
                                disabled={submitTestimonialLoading}
                            ></textarea>
                            
                            <div className="comment-footer">
                                <div className="char-counter">
                                    <span id="charCount">{commentText.length}</span>/500 karakter
                                </div>
                                <button 
                                    type="button" 
                                    className="submit-btn" 
                                    onClick={handleSubmitTestimonial} 
                                    disabled={!commentText || rating === 0 || submitTestimonialLoading}
                                >
                                    {submitTestimonialLoading ? 'Mengirim...' : 'Kirim Testimoni'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div id="successMessage" className="success-message" style={{ display: 'block' }}>
                            <div className="success-icon">✓</div>
                            <h3>Terima Terima kasih!</h3>
                            <p>Testimoni Anda telah berhasil dikirim dan akan ditampilkan setelah diverifikasi.</p>
                            <button type="button" className="btn-secondary" onClick={resetTestimonialForm}>Tulis Testimoni Lagi</button>
                        </div>
                    )}
                </div>
            </section>

            {/* Testimoni Section */}
            <section id="testimoni" className="testimoni-section">
                <div className="container">
                    <h2>Testimoni Pelanggan</h2>
                    <div className="comments-count">{allTestimonials.length} COMMENTS</div>
                    
                    <div className="comments-container">
                        {allTestimonials.length > 0 ? (
                            allTestimonials.map((testimonial) => (
                                <TestimonialItem
                                    key={testimonial.id}
                                    avatarInitials={testimonial.user_nama_lengkap ? 
                                        testimonial.user_nama_lengkap.split(' ').map(n => n[0]).join('').toUpperCase() : 
                                        'U'
                                    }
                                    name={testimonial.user_nama_lengkap || 'Pengguna'}
                                    rating={'⭐'.repeat(testimonial.rating)}
                                    date={formatDate(testimonial.created_at)}
                                    text={testimonial.content}
                                />
                            ))
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">⭐</div>
                                <h3>Belum ada testimoni</h3>
                                <p>Jadilah yang pertama memberikan testimoni!</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Popup Reservasi */}
            {reservasiPopupOpen && (
                <div id="reservasiPopup" className="popup-overlay active">
                    <div className="popup-content">
                        <div className="popup-header">
                            <h3>Form Reservasi Motor</h3>
                            <button className="close-btn" onClick={closeReservasiPopup}>&times;</button>
                        </div>
                        <form id="reservasiForm" className="popup-form" onSubmit={handleReservasiSubmit}>
                            {/* Pilihan Motor */}
                            <div className="form-group">
                                <label>Pilih Motor:</label>
                                <select 
                                    // Gunakan selectedMotorForCalendar untuk nilai untuk mengontrol dropdown ini
                                    value={selectedMotorForCalendar || ''} 
                                    onChange={(e) => {
                                        const selectedMotorId = e.target.value;
                                        setSelectedMotorForCalendar(selectedMotorId ? parseInt(selectedMotorId) : null);
                                        // Reset tanggal & durasi saat motor diubah
                                        setTanggalSewaInput('');
                                        setLamaSewaInput('');
                                        setAvailableMotorsFilteredByDate([]); // Hapus motor yang difilter untuk pilihan baru
                                        setSelectedMerk('');
                                        setAvailableTipeMotor([]);
                                        setCurrentTipeMotor('');
                                    }}
                                    disabled={submitReservationLoading}
                                    name="selectedMotorId" // Tambahkan nama untuk FormData, meskipun kita akan menggunakan nilai state secara langsung
                                >
                                    <option value="">Pilih Motor</option>
                                    {allMotors.filter(m => m.status === 'available').map(motor => ( // Hanya tampilkan motor yang tersedia
                                        <option key={motor.id} value={motor.id}>
                                            {motor.brand} {motor.type} ({formatPrice(motor.price)})
                                        </option>
                                    ))}
                                </select>
                                {!selectedMotorForCalendar && (
                                    <small style={{ color: 'red', fontSize: '12px' }}>
                                        * Pilih motor terlebih dahulu untuk melihat ketersediaan.
                                    </small>
                                )}
                            </div>

                            {selectedMotorForCalendar && (
                                <div className="form-group">
                                    <label>Jadwal Ketersediaan:</label>
                                    <MotorAvailabilityCalendar 
                                        motorId={selectedMotorForCalendar} 
                                        onDateSelect={handleCalendarDateSelect}
                                    />
                                </div>
                            )}

                            {/* Tanggal Mulai & Lama Sewa (akan diisi dari kalender) */}
                            <div className="form-group">
                                <label>Tanggal Mulai Sewa:</label>
                                <input 
                                    type="date" 
                                    id="tanggalSewa" 
                                    name="tanggalSewa" // Pertahankan nama untuk FormData, tetapi nilai dikontrol oleh state
                                    value={tanggalSewaInput}
                                    onChange={() => {}} // Hapus onChange langsung, dikontrol oleh kalender
                                    required 
                                    readOnly={true} // Selalu readOnly karena diisi oleh kalender
                                    disabled={submitReservationLoading || !selectedMotorForCalendar}
                                    style={{ 
                                        backgroundColor: selectedMotorForCalendar ? '#e9ecef' : '', 
                                        cursor: selectedMotorForCalendar ? 'not-allowed' : 'auto' 
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="lama_sewa">Lama Sewa (Hari)</label>
                                <input
                                    type="number"
                                    id="lama_sewa"
                                    name="lama_sewa" // Pertahankan nama untuk FormData, tetapi nilai dikontrol oleh state
                                    value={lamaSewaInput}
                                    disabled={true}  // Dinonaktifkan karena diatur oleh kalender
                                    placeholder="Pilih tanggal di kalender untuk menentukan lama sewa"
                                    className="form-control disabled-field"
                                    style={{
                                        backgroundColor: '#f5f5f5',
                                        cursor: 'not-allowed',
                                        color: '#666'
                                    }}
                                />
                                <small className="form-text text-muted">
                                    Lama sewa akan otomatis terisi sesuai dengan rentang tanggal yang Anda pilih di kalender
                                </small>
                            </div>

                            {/* Merk & Tipe Motor (akan diisi otomatis berdasarkan selectedMotorForCalendar) */}
                            {/* Dropdown ini dapat dinonaktifkan jika selectedMotorForCalendar sudah diatur,
                                karena motor yang dipilih menentukan merek dan tipe */}
                            <div className="form-group">
                                <label>Merk Motor:</label>
                                <input 
                                    type="text"
                                    id="merkMotor" 
                                    name="merkMotor" 
                                    value={selectedMerk} 
                                    readOnly 
                                    disabled={true} // DIPERBAIKI: selalu dinonaktifkan, ditentukan oleh selectedMotorForCalendar
                                    style={{ 
                                        backgroundColor: '#f5f5f5', 
                                        cursor: 'not-allowed',
                                        color: '#666'
                                    }}
                                />
                                {/* Input tersembunyi untuk memastikan nilai dikirim jika diperlukan, meskipun kita akan menggunakan nilai state secara langsung */}
                                <input type="hidden" name="merkMotorHidden" value={selectedMerk} />
                            </div>
                            <div className="form-group">
                                <label>Tipe Motor:</label>
                                <input 
                                    type="text"
                                    id="tipeMotor" 
                                    name="tipeMotor" 
                                    value={currentTipeMotor} 
                                    readOnly 
                                    disabled={true} // DIPERBAIKI: selalu dinonaktifkan, ditentukan oleh selectedMotorForCalendar
                                    style={{ 
                                        backgroundColor: '#f5f5f5', 
                                        cursor: 'not-allowed',
                                        color: '#666'
                                    }}
                                />
                                {/* Input tersembunyi untuk FormData jika diperlukan */}
                                <input type="hidden" name="tipeMotorHidden" value={currentTipeMotor} />
                            </div>
                            
                            {/* Data Pengguna & Lokasi Jemput */}
                            <div className="form-group">
                                <label>Nama Lengkap:</label>
                                <input 
                                    type="text" 
                                    id="namaLengkap" 
                                    name="namaLengkap" 
                                    value={currentUser?.nama_lengkap || ''} 
                                    placeholder="Nama sesuai KTP" 
                                    required 
                                    readOnly 
                                    style={{ 
                                        backgroundColor: '#f5f5f5', 
                                        cursor: 'not-allowed',
                                        color: '#666'
                                    }}
                                />
                                <input type="hidden" name="namaLengkapHidden" value={currentUser?.nama_lengkap || ''} />
                                <small style={{ color: '#666', fontSize: '12px' }}>
                                    * Data ini diambil dari profil akun Anda
                                    {!currentUser?.nama_lengkap && 
                                        <span style={{color: 'red'}}> - Nama tidak ditemukan, silakan update profil</span>
                                    }
                                </small>
                            </div>

                            <div className="form-group">
                                <label>No. HP:</label>
                                <input 
                                    type="tel" 
                                    id="noHp" 
                                    name="noHp" 
                                    value={currentUser?.no_hp || ''} 
                                    placeholder="08123456789" 
                                    required 
                                    readOnly 
                                    style={{ 
                                        backgroundColor: '#f5f5f5', 
                                        cursor: 'not-allowed',
                                        color: '#666'
                                    }}
                                />
                                <input type="hidden" name="noHpHidden" value={currentUser?.no_hp || ''} />
                                <small style={{ color: '#666', fontSize: '12px' }}>
                                    * Data ini diambil dari profil akun Anda
                                    {!currentUser?.no_hp && 
                                        <span style={{color: 'red'}}> - Nomor HP tidak ditemukan, silakan update profil</span>
                                    }
                                </small>
                            </div>
                            <div className="form-group">
                                <label>Lokasi Jemput:</label>
                                <input 
                                    type="text" 
                                    id="lokasi_jemput" 
                                    name="lokasi_jemput" 
                                    placeholder="Masukkan alamat untuk penjemputan motor"
                                    required 
                                    disabled={submitReservationLoading}
                                />
                                <small style={{ color: '#666', fontSize: '12px' }}>
                                    * Alamat lengkap tempat motor akan dijemput
                                </small>
                            </div>
                            <div className="form-group">
                                <label>Catatan Reservasi (Opsional):</label>
                                <textarea 
                                    id="catatan" 
                                    name="catatanReservasi" 
                                    placeholder="Tuliskan catatan khusus untuk reservasi Anda..."
                                    disabled={submitReservationLoading}
                                    style={{ minHeight: '80px', resize: 'vertical' }}
                                ></textarea>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-cancel" onClick={closeReservasiPopup} disabled={submitReservationLoading}>
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn-submit" 
                                    // Nonaktifkan submit jika motor tidak dipilih, tanggal tidak dipilih, atau jika sedang memuat
                                    disabled={submitReservationLoading || !selectedMotorForCalendar || !tanggalSewaInput || !lamaSewaInput}
                                >
                                    {submitReservationLoading ? 'Mengirim...' : 'Kirim Reservasi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <Footer />
        </>
    );
};

export default Index;