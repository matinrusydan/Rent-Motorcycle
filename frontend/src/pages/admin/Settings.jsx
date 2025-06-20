// frontend/src/pages/admin/Settings.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// ✅ Ingat: Halaman admin TIDAK mengimpor Header dan Footer dari komponen utama situs.
// Mereka seharusnya menggunakan layout admin tersendiri (misal: AdminLayout atau struktur DashboardAdmin).

// CSS yang relevan
import '../../assets/css/admin/dashboard.css'; // Untuk gaya admin umum
// Anda mungkin juga perlu CSS khusus settings admin jika ada dari folder statis Anda
// import '../../assets/css/settings.css'; // Contoh jika ada
import '../../assets/css/global.css';

const SettingsAdmin = () => {
    // State untuk pengaturan umum
    const [namaAplikasi, setNamaAplikasi] = useState('RentalMotor');
    const [emailSupport, setEmailSupport] = useState('info@rentalmotor.com');
    const [noHpSupport, setNoHpSupport] = useState('+62 812-3456-7890');
    const [alamatKantor, setAlamatKantor] = useState('Bekasi, Jawa Barat');

    // State untuk pengaturan keuangan/pembayaran
    const [namaBank, setNamaBank] = useState('Bank Central Asia (BCA)');
    const [nomorRekening, setNomorRekening] = useState('1234567890');
    const [atasNamaRekening, setAtasNamaRekening] = useState('PT. Rental Motor Indonesia');

    // State untuk pesan konfirmasi
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' atau 'error'

    // Fungsi untuk memuat pengaturan dari backend (saat terintegrasi)
    useEffect(() => {
        // Contoh:
        // const fetchSettings = async () => {
        //     try {
        //         const response = await axios.get('/api/admin/settings', {
        //             headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        //         });
        //         const settings = response.data;
        //         setNamaAplikasi(settings.namaAplikasi);
        //         setEmailSupport(settings.emailSupport);
        //         setNoHpSupport(settings.noHpSupport);
        //         setAlamatKantor(settings.alamatKantor);
        //         setNamaBank(settings.namaBank);
        //         setNomorRekening(settings.nomorRekening);
        //         setAtasNamaRekening(settings.atasNamaRekening);
        //     } catch (error) {
        //         console.error('Error fetching settings:', error);
        //         setMessage('Gagal memuat pengaturan.');
        //         setMessageType('error');
        //     }
        // };
        // fetchSettings();
    }, []);

    // Fungsi untuk menyimpan pengaturan ke backend
    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setMessage(''); // Clear previous messages

        // Data yang akan dikirim ke backend
        const settingsData = {
            namaAplikasi,
            emailSupport,
            noHpSupport,
            alamatKantor,
            namaBank,
            nomorRekening,
            atasNamaRekening,
        };

        // Contoh:
        // try {
        //     await axios.put('/api/admin/settings', settingsData, {
        //         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        //     });
        //     setMessage('Pengaturan berhasil disimpan!');
        //     setMessageType('success');
        // } catch (error) {
        //     console.error('Error saving settings:', error);
        //     setMessage('Gagal menyimpan pengaturan.');
        //     setMessageType('error');
        // }
        
        // Simulasi berhasil disimpan
        console.log('Pengaturan disimpan (simulasi):', settingsData);
        setMessage('Pengaturan berhasil disimpan (simulasi)!');
        setMessageType('success');
    };

    return (
        // Wrapper div ini akan diganti oleh layout admin yang sebenarnya
        <div id="wrapper"> {/* Bagian dari layout admin DashboardAdmin.jsx */}
            {/* Sidebar dan Topbar admin akan berada di sini jika menggunakan AdminLayout */}
            {/* Untuk demo ini, kita hanya menampilkan konten utama */}

            <div id="content-wrapper" className="d-flex flex-column">
                <div id="content">
                    {/* Topbar Placeholder, idealnya dari AdminLayout */}
                    <nav className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow">
                        <ul className="navbar-nav ml-auto">
                            <li className="nav-item dropdown no-arrow">
                                <a className="nav-link dropdown-toggle" href="#" id="userDropdown" role="button"
                                    data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    <span className="mr-2 d-none d-lg-inline text-gray-600 small">Admin</span>
                                    <img className="img-profile rounded-circle"
                                        src="https://via.placeholder.com/40x40" alt="Profile" />
                                </a>
                                <div className="dropdown-menu dropdown-menu-right shadow animated--grow-in"
                                    aria-labelledby="userDropdown">
                                    <Link className="dropdown-item" to="/admin/settings">
                                        <i className="fas fa-cogs fa-sm fa-fw mr-2 text-gray-400"></i>
                                        Settings
                                    </Link>
                                    <div className="dropdown-divider"></div>
                                    <a className="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#logoutModal">
                                        <i className="fas fa-sign-out-alt fa-sm fa-fw mr-2 text-gray-400"></i>
                                        Logout
                                    </a>
                                </div>
                            </li>
                        </ul>
                    </nav>

                    <div className="container-fluid">
                        <div className="d-sm-flex align-items-center justify-content-between mb-4">
                            <h1 className="h3 mb-0 text-gray-800">Pengaturan Aplikasi</h1>
                        </div>

                        {message && (
                            <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'}`} role="alert">
                                {message}
                            </div>
                        )}

                        <form onSubmit={handleSaveSettings}>
                            {/* Pengaturan Umum */}
                            <div className="card shadow mb-4">
                                <div className="card-header py-3">
                                    <h6 className="m-0 font-weight-bold text-primary">Informasi Umum</h6>
                                </div>
                                <div className="card-body">
                                    <div className="form-group mb-3">
                                        <label htmlFor="namaAplikasi" className="form-label">Nama Aplikasi</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="namaAplikasi"
                                            value={namaAplikasi}
                                            onChange={(e) => setNamaAplikasi(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label htmlFor="emailSupport" className="form-label">Email Support</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            id="emailSupport"
                                            value={emailSupport}
                                            onChange={(e) => setEmailSupport(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label htmlFor="noHpSupport" className="form-label">No. HP Support</label>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            id="noHpSupport"
                                            value={noHpSupport}
                                            onChange={(e) => setNoHpSupport(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label htmlFor="alamatKantor" className="form-label">Alamat Kantor</label>
                                        <textarea
                                            className="form-control"
                                            id="alamatKantor"
                                            rows="3"
                                            value={alamatKantor}
                                            onChange={(e) => setAlamatKantor(e.target.value)}
                                            required
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            {/* Pengaturan Pembayaran */}
                            <div className="card shadow mb-4">
                                <div className="card-header py-3">
                                    <h6 className="m-0 font-weight-bold text-primary">Pengaturan Pembayaran</h6>
                                </div>
                                <div className="card-body">
                                    <div className="form-group mb-3">
                                        <label htmlFor="namaBank" className="form-label">Nama Bank</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="namaBank"
                                            value={namaBank}
                                            onChange={(e) => setNamaBank(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label htmlFor="nomorRekening" className="form-label">Nomor Rekening</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="nomorRekening"
                                            value={nomorRekening}
                                            onChange={(e) => setNomorRekening(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label htmlFor="atasNamaRekening" className="form-label">Atas Nama Rekening</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="atasNamaRekening"
                                            value={atasNamaRekening}
                                            onChange={(e) => setAtasNamaRekening(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary">Simpan Pengaturan</button>
                        </form>
                    </div>
                </div>
                 {/* Footer Admin Placeholder */}
                 <footer className="sticky-footer bg-white">
                    <div className="container my-auto">
                        <div className="copyright text-center my-auto">
                            <span>Copyright &copy; Motor Rental 2024</span>
                        </div>
                    </div>
                </footer>
            </div>
            {/* Scroll to Top Button dan Logout Modal perlu diletakkan di layout utama Admin */}
            {/* Contoh Logout Modal (perlu ada di AdminLayout atau App.jsx untuk diakses dari mana saja) */}
            <div className="modal fade" id="logoutModal" tabIndex="-1" role="dialog" aria-labelledby="exampleModalLabel"
                aria-hidden="true">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="exampleModalLabel">Ready to Leave?</h5>
                            <button className="close" type="button" data-bs-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">×</span>
                            </button>
                        </div>
                        <div className="modal-body">Select "Logout" below if you are ready to end your current session.</div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" type="button" data-bs-dismiss="modal">Cancel</button>
                            <Link className="btn btn-primary" to="/login">Logout</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsAdmin;