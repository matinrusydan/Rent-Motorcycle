// frontend/src/pages/Pembayaran.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // ✅ Tambahkan useNavigate
import axios from 'axios'; // ✅ Import Axios
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import '../assets/css/pembayaran.css';
import '../assets/css/global.css';

const Pembayaran = () => {
    const [reservationDetails, setReservationDetails] = useState({
        motor: 'Loading...',
        nama: 'Loading...',
        tanggal: 'Loading...',
        lama: 'Loading...',
        total: 'Rp 0'
    });

    const [buktiPembayaran, setBuktiPembayaran] = useState(null);
    const [catatanTambahan, setCatatanTambahan] = useState('');
    const [fileNameDisplay, setFileNameDisplay] = useState('');
    const [uploadSuccessVisible, setUploadSuccessVisible] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false); // State untuk loading upload
    const [error, setError] = useState(null); // State untuk error
    const [reservationId, setReservationId] = useState(null); // State untuk menyimpan reservationId

    const location = useLocation();
    const navigate = useNavigate(); // ✅ Inisialisasi useNavigate

    const getApiUrl = () => {
        return import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';
    };

    // Fungsi untuk memuat detail reservasi dari backend
    const fetchReservationDetails = useCallback(async (id) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Anda harus login untuk melihat detail reservasi.');
                navigate('/login');
                return;
            }

            // Anda perlu endpoint backend untuk mendapatkan detail reservasi berdasarkan ID
            // Contoh: /api/reservations/:id (ini rute admin, Anda mungkin butuh rute user-spesifik)
            // Untuk demo ini, asumsikan ada endpoint untuk user melihat reservasi mereka
            // atau modifikasi rute admin agar bisa diakses user tertentu (misal: authorizeRole(['admin', 'user']))
            const response = await axios.get(`${getApiUrl()}/api/user/reservations/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const resData = response.data.data;
            if (resData) {
                setReservationDetails({
                    motor: `${resData.motor_brand} ${resData.motor_type}`, // Sesuaikan dengan respons backend
                    nama: resData.user_nama_lengkap, // Sesuaikan dengan respons backend
                    tanggal: new Date(resData.tanggal_mulai).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
                    lama: `${resData.lama_sewa} hari`,
                    total: `Rp ${parseFloat(resData.total_harga).toLocaleString('id-ID')}`
                });
            }
        } catch (err) {
            console.error('Error fetching reservation details:', err);
            setError(`Gagal memuat detail reservasi: ${err.response?.data?.message || err.message}`);
            // Opsional: Redirect jika reservasi tidak ditemukan atau error
            // navigate('/');
        }
    }, [navigate]);


    // useEffect untuk memuat data reservasi jika ada dari state navigasi
    useEffect(() => {
        const state = location.state || {};
        const { reservationId, totalHarga } = state; // Ambil reservationId dan totalHarga

        if (reservationId) {
            setReservationId(reservationId); // Simpan ID reservasi di state
            // Fetch detail reservasi dari backend jika ID tersedia
            // Jika Anda sudah memiliki semua data di `totalHarga` dan `reservasiData`, Anda bisa langsung set state
            // Daripada fetch lagi, kita gunakan data yang sudah ada (jika lengkap)
            setReservationDetails(prev => ({
                ...prev,
                total: `Rp ${parseFloat(totalHarga).toLocaleString('id-ID')}`
            }));
            fetchReservationDetails(reservationId); // Panggil untuk mendapatkan detail motor, nama user, dll.
        } else {
            // Jika tidak ada reservationId, mungkin pengguna langsung mengakses halaman ini
            // Anda bisa redirect atau menampilkan pesan error
            setError('Detail reservasi tidak ditemukan. Silakan buat reservasi terlebih dahulu.');
            // navigate('/'); // Redirect ke halaman utama
        }
    }, [location.state, fetchReservationDetails, navigate]);

    // Fungsi helper untuk menyalin teks ke clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('Nomor rekening berhasil disalin!');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Gagal menyalin nomor rekening.');
        });
    };

    // Handler untuk perubahan input file
    const handleFileUploadChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('File terlalu besar. Maksimal 5MB.');
                e.target.value = '';
                setBuktiPembayaran(null);
                setFileNameDisplay('');
                setUploadSuccessVisible(false);
                return;
            }
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                alert('Format file tidak didukung. Gunakan JPG, PNG, atau PDF.');
                e.target.value = '';
                setBuktiPembayaran(null);
                setFileNameDisplay('');
                setUploadSuccessVisible(false);
                return;
            }

            setBuktiPembayaran(file);
            setFileNameDisplay(file.name);
            setUploadSuccessVisible(true);
            setError(null); // Clear previous error
        } else {
            setBuktiPembayaran(null);
            setFileNameDisplay('');
            setUploadSuccessVisible(false);
        }
    };

    // Handler untuk event drag dan drop
    const handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.style.borderColor = 'var(--primary-color)';
        e.currentTarget.style.backgroundColor = 'var(--gray-100)';
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.currentTarget.style.borderColor = 'var(--gray-300)';
        e.currentTarget.style.backgroundColor = 'transparent';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.currentTarget.style.borderColor = 'var(--gray-300)';
        e.currentTarget.style.backgroundColor = 'transparent';

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(files[0]);
            document.getElementById('buktiPembayaran').files = dataTransfer.files;
            handleFileUploadChange({ target: { files: files } });
        }
    };

    // Handler submit form pembayaran
    const handlePembayaranSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setUploadLoading(true);

        if (!buktiPembayaran) {
            setError('Mohon upload bukti pembayaran!');
            setUploadLoading(false);
            return;
        }

        if (!reservationId) {
            setError('ID Reservasi tidak ditemukan. Harap refresh halaman atau hubungi dukungan.');
            setUploadLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('reservasi_id', reservationId); // Kirim ID reservasi
        formData.append('buktiPembayaran', buktiPembayaran); // Ini nama field yang diharapkan multer di backend
        formData.append('catatanTambahan', catatanTambahan);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Anda harus login untuk mengunggah bukti pembayaran.');
                navigate('/login');
                setUploadLoading(false);
                return;
            }

            const response = await axios.post(`${getApiUrl()}/api/payments/upload-proof`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Penting untuk upload file
                    'Authorization': `Bearer ${token}`
                },
                // OnUploadProgress bisa ditambahkan jika ingin menampilkan progress bar
            });

            console.log('Respons upload:', response.data);
            alert(response.data.message || 'Bukti pembayaran berhasil diunggah!');

            // Redirect ke WhatsApp
            setTimeout(() => {
                const phoneNumber = '6281234567890'; // Ganti dengan nomor WhatsApp admin Anda
                const message = encodeURIComponent(`Halo, saya sudah melakukan pembayaran untuk reservasi ID ${reservationId}. Mohon dikonfirmasi. Terima kasih!`);
                const waUrl = `https://wa.me/${phoneNumber}?text=${message}`;

                // Konfirmasi dengan user sebelum redirect
                if (window.confirm('Terima kasih! Bukti pembayaran Anda telah terkirim. Anda akan diarahkan ke WhatsApp untuk konfirmasi lebih lanjut dengan admin.')) {
                    window.open(waUrl, '_blank');
                    // Opsional: setelah WhatsApp, redirect kembali ke halaman utama atau riwayat reservasi
                    navigate('/'); // Atau halaman lain
                } else {
                    // Jika user tidak ingin diarahkan ke WhatsApp
                    navigate('/'); // Atau halaman lain
                }

            }, 500);

        } catch (err) {
            console.error('Error uploading payment proof:', err);
            let errorMessage = 'Gagal mengunggah bukti pembayaran: ';
            if (err.response?.data?.message) {
                errorMessage += err.response.data.message;
            } else if (err.message) {
                errorMessage += err.message;
            }
            setError(errorMessage);
        } finally {
            setUploadLoading(false);
        }
    };


    return (
        <>
            <Header />

            {/* Main Content */}
            <main className="main-content">
                <div className="container">

                    {error && (
                        <div className="error-alert" style={{ marginBottom: '20px' }}>
                            <span className="error-icon">⚠️</span>
                            {error}
                            <button className="error-close" onClick={() => setError(null)}>✖️</button>
                        </div>
                    )}

                    <div className="pembayaran-wrapper">

                        {/* Progress Indicator */}
                        <div className="progress-indicator">
                            <div className="progress-step completed">
                                <div className="step-number">1</div>
                                <span>Pilih Motor</span>
                            </div>
                            <div className="progress-line completed"></div>
                            <div className="progress-step completed">
                                <div className="step-number">2</div>
                                <span>Detail Booking</span>
                            </div>
                            <div className="progress-line active"></div>
                            <div className="progress-step active">
                                <div className="step-number">3</div>
                                <span>Pembayaran</span>
                            </div>
                        </div>

                        {/* Header Pembayaran */}
                        <div className="page-header">
                            <div className="header-icon">💳</div>
                            <h1 className="page-title">Pembayaran</h1>
                            <p className="page-subtitle">Selesaikan pembayaran untuk konfirmasi reservasi Anda</p>
                        </div>

                        <div className="content-grid">
                            {/* Left Column */}
                            <div className="left-column">
                                {/* Ringkasan Reservasi */}
                                <div className="card reservation-summary">
                                    <div className="card-header">
                                        <h2 className="card-title">📋 Ringkasan Reservasi</h2>
                                    </div>
                                    <div className="card-content">
                                        <div className="summary-item">
                                            <div className="summary-label">Motor</div>
                                            <div className="summary-value" id="motorDetail">{reservationDetails.motor}</div>
                                        </div>
                                        <div className="summary-item">
                                            <div className="summary-label">Nama Penyewa</div>
                                            <div className="summary-value" id="namaDetail">{reservationDetails.nama}</div>
                                        </div>
                                        <div className="summary-item">
                                            <div className="summary-label">Tanggal Sewa</div>
                                            <div className="summary-value" id="tanggalDetail">{reservationDetails.tanggal}</div>
                                        </div>
                                        <div className="summary-item">
                                            <div className="summary-label">Lama Sewa</div>
                                            <div className="summary-value" id="lamaDetail">{reservationDetails.lama}</div>
                                        </div>

                                        <div className="total-section">
                                            <div className="total-label">Total Pembayaran</div>
                                            <div className="total-amount" id="totalHarga">{reservationDetails.total}</div>
                                            <div className="total-note">Sudah termasuk biaya administrasi</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Info Pembayaran */}
                                <div className="card payment-info">
                                    <div className="card-header">
                                        <h2 className="card-title">🏦 Informasi Pembayaran</h2>
                                    </div>
                                    <div className="card-content">
                                        <div className="bank-info">
                                            <div className="bank-header">
                                                <div className="bank-icon">🏛️</div>
                                                <div className="bank-name">Bank Central Asia (BCA)</div>
                                            </div>
                                            <div className="bank-details">
                                                <div className="bank-detail-item">
                                                    <span className="detail-label">No. Rekening</span>
                                                    <span className="detail-value account-number">1234567890</span>
                                                    <button className="copy-btn" onClick={() => copyToClipboard('1234567890')}>📋</button>
                                                </div>
                                                <div className="bank-detail-item">
                                                    <span className="detail-label">Atas Nama</span>
                                                    <span className="detail-value">PT. Rental Motor Indonesia</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="payment-steps">
                                            <h4 className="steps-title">📝 Langkah Pembayaran</h4>
                                            <div className="steps-list">
                                                <div className="step-item">
                                                    <div className="step-icon">1</div>
                                                    <div className="step-text">Transfer sesuai nominal yang tertera</div>
                                                </div>
                                                <div className="step-item">
                                                    <div className="step-icon">2</div>
                                                    <div className="step-text">Simpan bukti transfer</div>
                                                </div>
                                                <div className="step-item">
                                                    <div className="step-icon">3</div>
                                                    <div className="step-text">Upload bukti di form sebelah</div>
                                                </div>
                                                <div className="step-item">
                                                    <div className="step-icon">4</div>
                                                    <div className="step-text">Konfirmasi pembayaran</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="right-column">
                                {/* Form Upload Bukti */}
                                <div className="card upload-form">
                                    <div className="card-header">
                                        <h2 className="card-title">📤 Upload Bukti Pembayaran</h2>
                                    </div>
                                    <div className="card-content">
                                        <form id="pembayaranForm" className="payment-form" onSubmit={handlePembayaranSubmit}>
                                            <div className="form-group">
                                                <label htmlFor="buktiPembayaran" className="form-label">Bukti Transfer</label>
                                                <div
                                                    className="file-upload-area"
                                                    onDragOver={handleDragOver}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={handleDrop}
                                                >
                                                    <input
                                                        type="file"
                                                        id="buktiPembayaran"
                                                        name="buktiPembayaran" // Nama harus sesuai dengan multer single('buktiPembayaran')
                                                        accept="image/*,.pdf"
                                                        onChange={handleFileUploadChange}
                                                        required
                                                        disabled={uploadLoading}
                                                    />
                                                    {!uploadSuccessVisible ? (
                                                        <div className="upload-placeholder">
                                                            <div className="upload-icon">📁</div>
                                                            <div className="upload-text">
                                                                <strong>Klik untuk pilih file</strong> atau drag & drop di sini
                                                            </div>
                                                            <div className="upload-note">JPG, PNG, PDF (Max. 5MB)</div>
                                                        </div>
                                                    ) : (
                                                        <div className="upload-success" style={{ display: 'flex' }}>
                                                            <div className="success-icon">✅</div>
                                                            <div className="success-text" id="fileName">{fileNameDisplay}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="catatanTambahan" className="form-label">Catatan Tambahan (Opsional)</label>
                                                <textarea
                                                    id="catatanTambahan"
                                                    name="catatanTambahan" // Nama harus sesuai dengan req.body di backend
                                                    className="form-textarea"
                                                    rows="3"
                                                    placeholder="Tambahkan catatan jika diperlukan..."
                                                    value={catatanTambahan}
                                                    onChange={(e) => setCatatanTambahan(e.target.value)}
                                                    disabled={uploadLoading}
                                                ></textarea>
                                            </div>

                                            <div className="form-actions">
                                                <Link to="/" className="btn btn-secondary" disabled={uploadLoading}>
                                                    Kembali
                                                </Link>
                                                <button type="submit" className="btn btn-primary" disabled={uploadLoading}>
                                                    {uploadLoading ? 'Mengunggah...' : 'Konfirmasi Pembayaran'}
                                                    {uploadLoading && <span className="spinner"></span>}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>

                                {/* Info Penting */}
                                <div className="card important-info">
                                    <div className="card-header warning">
                                        <h3 className="card-title">⚠️ Informasi Penting</h3>
                                    </div>
                                    <div className="card-content">
                                        <div className="info-list">
                                            <div className="info-item">
                                                <div className="info-icon">⏰</div>
                                                <div className="info-text">Pembayaran harus diselesaikan dalam 24 jam</div>
                                            </div>
                                            <div className="info-item">
                                                <div className="info-icon">✅</div>
                                                <div className="info-text">Reservasi dikonfirmasi setelah pembayaran terverifikasi</div>
                                            </div>
                                            <div className="info-item">
                                                <div className="info-icon">📞</div>
                                                <div className="info-text">Hubungi customer service jika ada kendala</div>
                                            </div>
                                            <div className="info-item">
                                                <div className="info-icon">🚫</div>
                                                <div className="info-text">Pembayaran yang sudah masuk tidak dapat dikembalikan</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </>
    );
};

export default Pembayaran;