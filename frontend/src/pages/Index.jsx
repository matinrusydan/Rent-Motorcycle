// frontend/src/pages/Index.jsx

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header.jsx'; 
import Footer from '../components/Footer.jsx';
import MotorCard from '../components/MotorCard.jsx'; 

// CSS yang relevan
import '../assets/css/style.css'; 
import '../assets/css/global.css'; 

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
    // State untuk data dinamis
    const [allMotors, setAllMotors] = useState([]); // Semua motor dari backend
    const [filteredDisplayMotors, setFilteredDisplayMotors] = useState([]); // Motor yang ditampilkan setelah filter
    const [motorBrands, setMotorBrands] = useState([]); // Merk motor unik untuk filter
    const [allTestimonials, setAllTestimonials] = useState([]); // Semua testimoni dari backend
    
    // State untuk UI feedback
    const [loadingMotors, setLoadingMotors] = useState(true);
    const [loadingTestimonials, setLoadingTestimonials] = useState(true);
    const [error, setError] = useState(null); // General error for fetches
    const [submitReservationLoading, setSubmitReservationLoading] = useState(false);
    const [submitTestimonialLoading, setSubmitTestimonialLoading] = useState(false);

    // State untuk form reservasi popup
    const [reservasiPopupOpen, setReservasiPopupOpen] = useState(false);
    const [selectedMerk, setSelectedMerk] = useState('');
    const [availableTipeMotor, setAvailableTipeMotor] = useState([]);
    const [currentTipeMotor, setCurrentTipeMotor] = useState('');

    // State untuk form testimoni
    const [commentText, setCommentText] = useState('');
    const [rating, setRating] = useState(0);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    // Refs untuk slider (tetap dipertahankan jika ingin slider, namun rendering motor akan disederhanakan)
    const hondaSliderRef = useRef(null);
    const yamahaSliderRef = useRef(null);
    const suzukiSliderRef = useRef(null);
    // State untuk melacak slide saat ini (jika masih menggunakan slider statis)
    const sliders = useRef({
        hondaSlider: { currentSlide: 0, totalSlides: 3, slidesPerPage: 3 },
        yamahaSlider: { currentSlide: 0, totalSlides: 3, slidesPerPage: 3 },
        suzukiSlider: { currentSlide: 0, totalSlides: 3, slidesPerPage: 3 }
    });

    const navigate = useNavigate(); // Inisialisasi useNavigate

    // Get API URL (konsisten dengan file frontend lainnya)
    const getApiUrl = () => {
        return import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';
    };

    // --- FUNGSI PENGAMBILAN DATA DARI BACKEND ---

    // Mengambil semua motor yang tersedia untuk publik
    const fetchPublicMotors = useCallback(async () => {
        setLoadingMotors(true);
        try {
            // ✅ Endpoint baru untuk motor publik (perlu dibuat di backend)
            const response = await axios.get(`${getApiUrl()}/api/motors/available`); 
            const motors = response.data.data;
            setAllMotors(motors);

            // Ekstrak merk unik untuk filter
            const brands = [...new Set(motors.map(m => m.brand))];
            setMotorBrands(['all', ...brands.filter(b => b)]); // Tambahkan 'all' dan hapus null/undefined
            
            // Inisialisasi motor yang ditampilkan (misal, semua Honda, Yamaha, Suzuki di grid terpisah)
            // Atau, kita bisa menampilkan semua dalam satu grid responsif sederhana jika slider dihilangkan.
            // Untuk demo ini, kita akan mengisi motorData untuk slider dengan data dari API
            // Ini akan membutuhkan penyesuaian jika ingin slider benar-benar dinamis per brand
            const groupedMotors = {};
            brands.forEach(brand => {
                groupedMotors[brand] = motors.filter(m => m.brand === brand);
            });
            // Untuk sementara, jika tetap pakai slider statis, motorData perlu diisi ulang
            // setFilteredDisplayMotors(motors); // Atau tampilkan semua di satu grid

        } catch (err) {
            console.error('Error fetching public motors:', err);
            setError(`Gagal memuat daftar motor: ${err.message}`);
            setAllMotors([]);
            setFilteredDisplayMotors([]);
            setMotorBrands([]);
        } finally {
            setLoadingMotors(false);
        }
    }, []); // Dependensi kosong agar hanya berjalan sekali saat mount

    // Mengambil semua testimoni yang disetujui untuk publik
    const fetchPublicTestimonials = useCallback(async () => {
        setLoadingTestimonials(true);
        try {
            // ✅ Endpoint baru untuk testimoni publik (perlu dibuat di backend)
            const response = await axios.get(`${getApiUrl()}/api/testimonials/approved`);
            setAllTestimonials(response.data.data); // Asumsi data testimoni ada di response.data.data
        } catch (err) {
            console.error('Error fetching public testimonials:', err);
            setError(`Gagal memuat testimoni: ${err.message}`);
            setAllTestimonials([]);
        } finally {
            setLoadingTestimonials(false);
        }
    }, []); // Dependensi kosong agar hanya berjalan sekali saat mount

    // --- USEEFFECTS UNTUK LOADING DATA ---
    useEffect(() => {
        fetchPublicMotors();
        fetchPublicTestimonials();
    }, [fetchPublicMotors, fetchPublicTestimonials]); // Panggil fetch saat fungsi berubah (hanya sekali)


    // --- LOGIKA SLIDER (Adaptasi dari JS statis, masih semi-statis untuk merek) ---
    // Efek untuk inisialisasi slider dan set min date pada mount komponen
    useEffect(() => {
        // Ini masih akan berjalan dengan asumsi slider DOM ada dan elemennya statis
        Object.keys(sliders.current).forEach(sliderId => {
            createDots(sliderId);
            updateSlider(sliderId);
        });

        const dateInput = document.getElementById('tanggalSewa');
        if (dateInput) {
            const today = new Date();
            const minDate = today.toISOString().split('T')[0];
            dateInput.min = minDate;
        }
    }, []);

    // Fungsi untuk membuat indikator titik slider
    const createDots = (sliderId) => {
        const dotsContainer = document.getElementById(sliderId.replace('Slider', 'Dots'));
        if (!dotsContainer) return;

        const totalSlides = sliders.current[sliderId].totalSlides;
        dotsContainer.innerHTML = ''; 
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('div');
            dot.className = 'slider-dot';
            dot.onclick = () => goToSlide(sliderId, i);
            dotsContainer.appendChild(dot);
        }
    };

    // Fungsi untuk memperbarui posisi slider dan status titik
    const updateSlider = (sliderId) => {
        const slider = document.getElementById(sliderId); // Akses DOM langsung
        if (!slider) return;

        const currentSlide = sliders.current[sliderId].currentSlide;
        // Total slides bisa dihitung dinamis jika ada motor per brand
        const totalSlides = sliders.current[sliderId].totalSlides; 
        
        slider.style.transform = `translateX(-${currentSlide * 100}%)`;
        
        const dotsContainer = document.getElementById(sliderId.replace('Slider', 'Dots'));
        if (dotsContainer) {
            const dots = dotsContainer.querySelectorAll('.slider-dot');
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentSlide);
            });
        }
        
        const prevBtn = document.getElementById(sliderId.replace('Slider', 'Prev'));
        const nextBtn = document.getElementById(sliderId.replace('Slider', 'Next'));
        
        if (prevBtn) prevBtn.disabled = currentSlide === 0;
        if (nextBtn) nextBtn.disabled = currentSlide === totalSlides - 1;
    };

    const nextSlide = (sliderId) => {
        const current = sliders.current[sliderId];
        if (current.currentSlide < current.totalSlides - 1) {
            current.currentSlide++;
            updateSlider(sliderId);
        }
    };

    const previousSlide = (sliderId) => {
        const current = sliders.current[sliderId];
        if (current.currentSlide > 0) {
            current.currentSlide--;
            updateSlider(sliderId);
        }
    };

    const goToSlide = (sliderId, slideIndex) => {
        sliders.current[sliderId].currentSlide = slideIndex;
        updateSlider(sliderId);
    };
    // --- AKHIR LOGIKA SLIDER ---


    // --- FUNGSI FORM RESERVASI ---
    // Fungsi untuk membuka popup reservasi
    const openReservasiPopup = useCallback((merk = '', tipe = '') => {
        setReservasiPopupOpen(true);
        document.body.style.overflow = 'hidden'; 
        setSelectedMerk(merk);
        // Isi tipe motor berdasarkan merk yang dipilih dari data dinamis
        const motorOfType = allMotors.filter(m => m.brand === merk);
        const uniqueTypes = [...new Set(motorOfType.map(m => m.type))];
        setAvailableTipeMotor(uniqueTypes.filter(t => t));
        setCurrentTipeMotor(tipe);
    }, [allMotors]); // allMotors sebagai dependensi

    // Fungsi untuk menutup popup reservasi
    const closeReservasiPopup = () => {
        setReservasiPopupOpen(false);
        document.body.style.overflow = 'auto'; 
        // Reset form state
        setSelectedMerk('');
        setAvailableTipeMotor([]);
        setCurrentTipeMotor('');
        // document.getElementById('reservasiForm').reset(); // Hanya jika form tidak dikontrol sepenuhnya oleh state
    };

    // Handler untuk perubahan merk motor di form reservasi
    const handleMerkChange = (e) => {
        const merk = e.target.value;
        setSelectedMerk(merk);
        const motorOfType = allMotors.filter(m => m.brand === merk);
        const uniqueTypes = [...new Set(motorOfType.map(m => m.type))];
        setAvailableTipeMotor(uniqueTypes.filter(t => t));
        setCurrentTipeMotor(''); 
    };

    // Handler untuk submit form reservasi
    const handleReservasiSubmit = async (e) => {
        e.preventDefault();
        setSubmitReservationLoading(true);
        setError(null);

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        // Validasi frontend
        if (!data.merkMotor || !data.tipeMotor || !data.namaLengkap || !data.noHp || !data.tanggalSewa || !data.lamaSewa) {
            setError('Mohon lengkapi semua field yang diperlukan untuk reservasi!');
            setSubmitReservationLoading(false);
            return;
        }
        const phonePattern = /^[0-9]{10,13}$/;
        if (!phonePattern.test(data.noHp.replace(/[^0-9]/g, ''))) {
            setError('Nomor HP tidak valid! Masukkan 10-13 digit angka.');
            setSubmitReservationLoading(false);
            return;
        }

        try {
            // Temukan motor_id berdasarkan merk dan tipe yang dipilih
            const selectedMotor = allMotors.find(m => m.brand === data.merkMotor && m.type === data.tipeMotor);
            if (!selectedMotor) {
                setError('Motor tidak ditemukan. Silakan pilih motor yang tersedia.');
                setSubmitReservationLoading(false);
                return;
            }

            const token = localStorage.getItem('token'); // Asumsi user sudah login
            const userId = JSON.parse(localStorage.getItem('user'))?.id;

            if (!token || !userId) {
                alert('Anda harus login untuk membuat reservasi.');
                navigate('/login');
                setSubmitReservationLoading(false);
                return;
            }

            // Hitung total harga (bisa juga dihitung di backend)
            const calculatedTotalHarga = parseFloat(selectedMotor.harga_sewa) * parseInt(data.lamaSewa);

            // ✅ Endpoint baru untuk membuat reservasi (perlu dibuat di backend)
            const response = await axios.post(`${getApiUrl()}/api/reservations`, {
                user_id: userId,
                motor_id: selectedMotor.id,
                tanggal_sewa: data.tanggalSewa,
                lama_sewa_hari: parseInt(data.lamaSewa),
                total_harga: calculatedTotalHarga,
                catatan: data.catatanReservasi || null // Tambahkan field catatan di form jika perlu
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert(response.data.message || 'Reservasi berhasil dibuat! Akan dialihkan ke halaman pembayaran.');
            navigate('/pembayaran', { state: { reservationId: response.data.reservationId, totalHarga: calculatedTotalHarga } }); // Redirect ke pembayaran
        } catch (err) {
            console.error('Error submitting reservation:', err);
            setError(`Gagal membuat reservasi: ${err.response?.data?.message || err.message}`);
        } finally {
            setSubmitReservationLoading(false);
        }
    };

    // --- FUNGSI FORM TESTIMONI ---
    // Handler untuk perubahan input testimoni
    const handleCommentChange = (e) => {
        setCommentText(e.target.value);
    };

    // Handler untuk perubahan rating testimoni
    const handleRatingChange = (e) => {
        setRating(parseInt(e.target.value));
    };

    // Handler untuk submit testimoni
    const handleSubmitTestimonial = async () => {
        setSubmitTestimonialLoading(true);
        setError(null);

        if (!commentText.trim() || rating === 0) {
            setError('Mohon isi testimoni dan berikan rating!');
            setSubmitTestimonialLoading(false);
            return;
        }

        const token = localStorage.getItem('token');
        const userId = JSON.parse(localStorage.getItem('user'))?.id;

        if (!token || !userId) {
            alert('Anda harus login untuk mengirim testimoni.');
            navigate('/login');
            setSubmitTestimonialLoading(false);
            return;
        }

        try {
            // ✅ Endpoint baru untuk mengirim testimoni (perlu dibuat di backend)
            const response = await axios.post(`${getApiUrl()}/api/testimonials`, {
                user_id: userId,
                content: commentText,
                rating: rating
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert(response.data.message || 'Testimoni berhasil dikirim!');
            setShowSuccessMessage(true); // Tampilkan pesan sukses frontend
            setCommentText(''); // Reset form
            setRating(0);
            document.querySelectorAll('input[name="rating"]').forEach(radio => radio.checked = false); // Reset radio
            // Perlu trigger fetchPublicTestimonials jika ingin melihat yang baru (setelah disetujui admin)
        } catch (err) {
            console.error('Error submitting testimonial:', err);
            setError(`Gagal mengirim testimoni: ${err.response?.data?.message || err.message}`);
        } finally {
            setSubmitTestimonialLoading(false);
        }
    };

    // Fungsi untuk mereset form testimoni
    const resetTestimonialForm = () => {
        setCommentText('');
        setRating(0);
        setShowSuccessMessage(false);
        // document.querySelectorAll('input[name="rating"]').forEach(radio => radio.checked = false);
    };

    // --- FUNGSI UTILITY ---
    // Get unique brands from motorData for filter options
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

    // Logika loading secara keseluruhan
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
                        {/* ✅ openReservasiPopup akan mengisi merk/tipe */}
                        <button className="btn-primary" onClick={() => openReservasiPopup()}>Reservasi Sekarang</button>
                    </div>
                    <div className="hero-image">
                        <div className="motor-placeholder">🏍️</div>
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
                        {/* Rendering Motor dari data dinamis */}
                        {motorBrands.filter(brand => brand !== 'all').map(brand => (
                            <div className="category" key={brand}>
                                <h3>{brand}</h3>
                                {/* Untuk saat ini, kita akan menampilkan semua motor dari brand ini dalam satu grid sederhana */}
                                <div className="motor-grid">
                                    {allMotors.filter(m => m.brand === brand && m.status === 'available').map(motor => (
                                        <MotorCard 
                                            key={motor.id}
                                            brand={motor.brand} 
                                            type={motor.type} 
                                            price={formatPrice(motor.harga_sewa)}
                                            specs={motor.specs} 
                                            openReservasiPopup={() => openReservasiPopup(motor.brand, motor.type)} 
                                        />
                                    ))}
                                </div>
                                {/* Slider controls if still needed, but logic would need major refactor for dynamic data */}
                                {/* Untuk demo, kita abaikan slider controller di sini jika rendering dinamis */}
                            </div>
                        ))}
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
                    
                    {/* Error alert for testimonial form */}
                    {error && submitTestimonialLoading && ( // Only show if error came from testimonial submit
                         <div className="error-alert">
                            <span className="error-icon">⚠️</span>
                            {error}
                            <button className="error-close" onClick={() => setError(null)}>✖️</button>
                        </div>
                    )}

                    {!showSuccessMessage ? (
                        <div className="comment-form-wrapper" id="commentForm">
                            <div className="user-info">
                                {/* Asumsi info user diambil dari localStorage jika sudah login */}
                                <div className="user-avatar">US</div>
                                <div className="user-details">
                                    <h4>Nama Pengguna</h4>
                                    <p>email@example.com</p>
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
                            <h3>Terima Kasih!</h3>
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
                                    key={testimonial.id} // Asumsi ada ID dari backend
                                    avatarInitials={testimonial.user_name ? testimonial.user_name.split(' ').map(n => n[0]).join('') : 'U'}
                                    name={testimonial.user_name || 'Pengguna'} // Asumsi user_name dari join
                                    rating={'⭐'.repeat(testimonial.rating)} // Asumsi rating angka
                                    date={formatDate(testimonial.created_at)} // Asumsi created_at dari backend
                                    text={testimonial.content} // Asumsi content dari backend
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
                            <div className="form-group">
                                <label>Merk Motor:</label>
                                <select id="merkMotor" name="merkMotor" value={selectedMerk} onChange={handleMerkChange} disabled={submitReservationLoading}>
                                    <option value="">Pilih Merk</option>
                                    {getUniqueBrands().map(merk => ( // Ambil dari getUniqueBrands
                                        <option key={merk} value={merk}>{merk}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Tipe Motor:</label>
                                <select id="tipeMotor" name="tipeMotor" value={currentTipeMotor} onChange={(e) => setCurrentTipeMotor(e.target.value)} disabled={!availableTipeMotor.length || submitReservationLoading}>
                                    <option value="">Pilih Tipe</option>
                                    {availableTipeMotor.map(tipe => (
                                        <option key={tipe} value={tipe}>{tipe}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Nama Lengkap:</label>
                                <input type="text" id="namaLengkap" name="namaLengkap" placeholder="Nama sesuai KTP" required disabled={submitReservationLoading} />
                            </div>
                            <div className="form-group">
                                <label>No. HP:</label>
                                <input type="tel" id="noHp" name="noHp" placeholder="08123456789" required disabled={submitReservationLoading} />
                            </div>
                            <div className="form-group">
                                <label>Tanggal Sewa:</label>
                                <input type="date" id="tanggalSewa" name="tanggalSewa" required disabled={submitReservationLoading} />
                            </div>
                            <div className="form-group">
                                <label>Lama Sewa (hari):</label>
                                <input type="number" id="lamaSewa" name="lamaSewa" min="1" placeholder="1" required disabled={submitReservationLoading} />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-cancel" onClick={closeReservasiPopup} disabled={submitReservationLoading}>
                                    Batal
                                </button>
                                <button type="submit" className="btn-submit" disabled={submitReservationLoading}>
                                    {submitReservationLoading ? 'Mengirim...' : 'Kirim Reservasi'}
                                </button>
                            </div>
                            {error && (
                                <div className="error-alert">
                                    <span className="error-icon">⚠️</span>
                                    {error}
                                    <button className="error-close" onClick={() => setError(null)}>✖️</button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}
            <Footer />
        </>
    );
}
export default Index;