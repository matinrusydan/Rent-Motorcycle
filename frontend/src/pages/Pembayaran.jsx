// frontend/src/pages/Pembayaran.jsx

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom'; // ✅ Tambahkan useLocation
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import '../assets/css/pembayaran.css'; // Pastikan jalur impor CSS sesuai
import '../assets/css/global.css'; // Jika global.css diperlukan

const Pembayaran = () => {
    // State untuk detail reservasi (saat ini dummy, nanti dari backend/props)
    const [reservationDetails, setReservationDetails] = useState({
        motor: 'Honda Beat',
        nama: 'Budi Santoso',
        tanggal: '21 Juni 2025',
        lama: '3 hari',
        total: 'Rp 240.000'
    });

    const [buktiPembayaran, setBuktiPembayaran] = useState(null); // State untuk file bukti pembayaran
    const [catatanTambahan, setCatatanTambahan] = useState('');
    const [fileNameDisplay, setFileNameDisplay] = useState('');
    const [uploadSuccessVisible, setUploadSuccessVisible] = useState(false);

    const location = useLocation(); // ✅ Inisialisasi useLocation

    // Fungsi helper untuk menghitung total harga (diambil dari js/script.js)
    const hitungTotalHarga = (tipeMotor, lamaSewa) => {
        const hargaPerHari = {
            'Beat': 80000,
            'Vario': 90000,
            'PCX': 120000,
            'Mio': 75000,
            'NMAX': 110000,
            'Aerox': 100000,
            'Address': 85000,
            'NEX': 70000,
            'Scoopy': 85000, // Menambahkan tipe motor yang mungkin ada di Index.jsx
            'ADV 150': 130000,
            'Genio': 95000,
            'Forza': 150000,
            'CB150R': 120000,
            'CRF150L': 140000,
            'Lexi': 95000,
            'FreeGo': 90000,
            'Gear': 85000,
            'XMAX': 140000,
            'R15': 125000,
            'MT-15': 130000,
            'Burgman': 120000,
            'GSX-R150': 135000,
            'GSX-S150': 125000,
            'Satria F150': 115000,
            'V-Strom 250': 160000,
            'Inazuma': 140000,
            'Jimny': 90000
        };
        
        const harga = hargaPerHari[tipeMotor] || 0;
        return harga * parseInt(lamaSewa);
    };

    // useEffect untuk memuat data reservasi jika ada dari state navigasi
    useEffect(() => {
        // ✅ Mengaktifkan logika untuk memuat data reservasi dari location.state
        const { reservasiData } = location.state || {}; // Ambil data dari state navigasi
        
        if (reservasiData) {
            setReservationDetails({ // <-- Fungsi setReservationDetails sekarang dipanggil
                motor: `${reservasiData.merkMotor} ${reservasiData.tipeMotor}`,
                nama: reservasiData.namaLengkap,
                tanggal: new Date(reservasiData.tanggalSewa).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
                lama: `${reservasiData.lamaSewa} hari`,
                total: `Rp ${hitungTotalHarga(reservasiData.tipeMotor, reservasiData.lamaSewa).toLocaleString('id-ID')}`
            });
        }
    }, [location.state]); // ✅ Tambahkan location.state sebagai dependensi useEffect

    // Fungsi helper untuk menyalin teks ke clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('Nomor rekening berhasil disalin!'); // Ganti dengan notifikasi/modal React yang lebih canggih
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Gagal menyalin nomor rekening.'); 
        });
    };

    // Handler untuk perubahan input file
    const handleFileUploadChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validasi ukuran dan tipe file (sesuai original JS)
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
    const handlePembayaranSubmit = (e) => {
        e.preventDefault();
        
        if (!buktiPembayaran) {
            alert('Mohon upload bukti pembayaran!');
            return;
        }
        
        // --- LOGIKA PENGIRIMAN DATA KE BACKEND AKAN DITEMPATKAN DI SINI ---
        const formData = new FormData();
        formData.append('buktiPembayaran', buktiPembayaran);
        formData.append('catatanTambahan', catatanTambahan);
        // formData.append('reservasi_id', idReservasiYangDidapat);
        
        console.log('Mengirim bukti pembayaran (simulasi):', {
            file: buktiPembayaran.name,
            catatan: catatanTambahan
        });
        alert('Bukti pembayaran berhasil di-upload!');
        
        // --- SIMULASI KONFIRMASI DAN REDIRECT KE WHATSAPP ---
        setTimeout(() => {
            if (window.confirm('Konfirmasi bahwa Anda sudah melakukan pembayaran sesuai dengan jumlah yang tertera?')) {
                const phoneNumber = '6281234567890';
                const message = encodeURIComponent('Halo, saya sudah melakukan pembayaran untuk rental motor. Mohon dikonfirmasi. Terima kasih!');
                const waUrl = `https://wa.me/${phoneNumber}?text=${message}`;
                
                alert('Terima kasih! Anda akan diarahkan ke WhatsApp untuk konfirmasi lebih lanjut.');
                window.open(waUrl, '_blank');
            }
        }, 1000);
    };

    return (
        <>
            <Header />

            {/* Main Content */}
            <main className="main-content">
                <div className="container">
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
                                                        accept="image/*,.pdf" 
                                                        onChange={handleFileUploadChange}
                                                        required 
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
                                                    className="form-textarea" 
                                                    rows="3" 
                                                    placeholder="Tambahkan catatan jika diperlukan..."
                                                    value={catatanTambahan}
                                                    onChange={(e) => setCatatanTambahan(e.target.value)}
                                                ></textarea>
                                            </div>
                                            
                                            <div className="form-actions">
                                                <Link to="/" className="btn btn-secondary">
                                                    Kembali
                                                </Link>
                                                <button type="submit" className="btn btn-primary">
                                                    <span className="btn-icon">💳</span>
                                                    Konfirmasi Pembayaran
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