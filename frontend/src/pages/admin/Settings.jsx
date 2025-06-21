// frontend/src/pages/admin/Settings.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import axios
import Sidebar from '../../components/admin/Sidebar.jsx'; // Import Sidebar

// CSS yang relevan
import '../../assets/css/admin/dashboard.css'; // Untuk gaya admin umum
import '../../assets/css/admin/sidebar.css'; // Untuk gaya sidebar
// Anda mungkin juga perlu CSS khusus settings admin jika ada
// import '../../assets/css/admin/settings.css'; // Contoh jika ada
import '../../assets/css/global.css';

const SettingsAdmin = () => {
    // State untuk email dan password admin
    const [currentAdminEmail, setCurrentAdminEmail] = useState('');
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [currentAdminPassword, setCurrentAdminPassword] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [confirmNewAdminPassword, setConfirmNewAdminPassword] = useState('');

    const [loadingSettings, setLoadingSettings] = useState(true); // State untuk loading pengaturan awal
    const [savingSettings, setSavingSettings] = useState(false); // State saat menyimpan
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' atau 'error'

    const navigate = useNavigate();

    const getApiUrl = () => {
        return import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';
    };

    // === Fungsionalitas SIDEBAR (Disalin dari Dashboard.jsx) ===
    const [isSidebarToggled, setIsSidebarToggled] = useState(false);

    useEffect(() => {
        if (isSidebarToggled) {
            document.body.classList.add('sidebar-toggled');
        } else {
            document.body.classList.remove('sidebar-toggled');
        }
        const handleResize = () => {
            if (window.innerWidth < 768) setIsSidebarToggled(true);
            else setIsSidebarToggled(false);
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => {
            window.removeEventListener('resize', handleResize);
            document.body.classList.remove('sidebar-toggled');
        };
    }, [isSidebarToggled]);
    // Fungsi untuk memuat pengaturan admin (email saat ini)
    const fetchAdminProfile = useCallback(async () => {
        setLoadingSettings(true);
        setMessage('');
        setMessageType('');
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Sesi Anda berakhir, silakan login kembali.');
                navigate('/login');
                return;
            }

            // Memanggil endpoint profil user (yang juga berlaku untuk admin)
            const response = await axios.get(`${getApiUrl()}/api/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Asumsi response.data.email berisi email admin
            setCurrentAdminEmail(response.data.email);
            setNewAdminEmail(response.data.email); // Inisialisasi newAdminEmail dengan current
            
        } catch (error) {
            console.error('Error fetching admin profile:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Gagal memuat profil admin.';
            setMessage(errorMessage);
            setMessageType('error');
            // Redirect jika token tidak valid/kadaluarsa
            if (error.response?.status === 401 || error.response?.status === 403) {
                navigate('/login');
            }
        } finally {
            setLoadingSettings(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchAdminProfile();
    }, [fetchAdminProfile]);


    // Fungsi untuk menyimpan pengaturan (mengubah email/password admin)
    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setMessage(''); // Clear previous messages
        setSavingSettings(true);

        if (newAdminPassword && newAdminPassword !== confirmNewAdminPassword) {
            setMessage('Konfirmasi password baru tidak cocok.');
            setMessageType('error');
            setSavingSettings(false);
            return;
        }
        if (newAdminPassword && newAdminPassword.length < 6) {
            setMessage('Password baru minimal 6 karakter.');
            setMessageType('error');
            setSavingSettings(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Sesi Anda berakhir, silakan login kembali.');
                navigate('/login');
                setSavingSettings(false);
                return;
            }

            const payload = {
                currentEmail: currentAdminEmail, // Email saat ini untuk verifikasi
                newEmail: newAdminEmail,
                currentPassword: currentAdminPassword, // Password saat ini untuk verifikasi
                newPassword: newAdminPassword || undefined // Kirim hanya jika ada
            };

            const response = await axios.put(`${getApiUrl()}/api/auth/admin/profile`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage(response.data.message);
            setMessageType('success');
            
            // Reset fields setelah berhasil
            setCurrentAdminPassword('');
            setNewAdminPassword('');
            setConfirmNewAdminPassword('');
            
            // Jika email berubah, token baru akan diberikan, dan user harus login ulang
            if (response.data.newToken) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                alert('Email berhasil diubah. Silakan login kembali dengan email baru Anda.');
                navigate('/login');
            } else {
                 // Jika tidak ada perubahan email, muat ulang profil untuk memastikan email saat ini terbaru
                 fetchAdminProfile();
            }

        } catch (error) {
            console.error('Error saving settings:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Gagal menyimpan pengaturan.';
            setMessage(errorMessage);
            setMessageType('error');
            // Jika password salah, mungkin perlu reset field password
            setCurrentAdminPassword('');
        } finally {
            setSavingSettings(false);
        }
    };

    // Tampilan loading
    if (loadingSettings) {
        return (
            <div id="wrapper" className={isSidebarToggled ? 'sidebar-toggled' : ''}>
                <Sidebar />
                <div id="content-wrapper" className="d-flex flex-column">
                    <div id="content">
                        <div className="loading-container">
                            <div className="loading-spinner">⏳</div>
                            <p>Memuat pengaturan...</p>
                        </div>
                    </div>
                    {/* Footer juga di sini untuk tampilan loading */}
                    {/* <Footer /> */}
                </div>
            </div>
        );
    }


    return (
        <div id="wrapper" className={isSidebarToggled ? 'sidebar-toggled' : ''}>
            <Sidebar />

            <div id="content-wrapper" className="d-flex flex-column">
                <div id="content">
                    <div className="container-fluid">
                        <div className="d-sm-flex align-items-center justify-content-between mb-4">
                            <h1 className="h3 mb-0 text-gray-800">Pengaturan Admin</h1>
                        </div>

                        {message && (
                            <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'}`} role="alert">
                                {message}
                            </div>
                        )}

                        <form onSubmit={handleSaveSettings}>
                            {/* Pengaturan Email Admin */}
                            <div className="card shadow mb-4">
                                <div className="card-header py-3">
                                    <h6 className="m-0 font-weight-bold text-primary">Ubah Email Admin</h6>
                                </div>
                                <div className="card-body">
                                    <div className="form-group mb-3">
                                        <label htmlFor="currentAdminEmail" className="form-label">Email Saat Ini</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            id="currentAdminEmail"
                                            value={currentAdminEmail}
                                            readOnly // Admin hanya melihat email saat ini, tidak mengeditnya langsung di sini
                                            disabled={savingSettings}
                                        />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label htmlFor="newAdminEmail" className="form-label">Email Baru</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            id="newAdminEmail"
                                            value={newAdminEmail}
                                            onChange={(e) => setNewAdminEmail(e.target.value)}
                                            required
                                            disabled={savingSettings}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Pengaturan Password Admin */}
                            <div className="card shadow mb-4">
                                <div className="card-header py-3">
                                    <h6 className="m-0 font-weight-bold text-primary">Ubah Password Admin</h6>
                                </div>
                                <div className="card-body">
                                    <div className="form-group mb-3">
                                        <label htmlFor="currentAdminPassword" className="form-label">Password Saat Ini</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            id="currentAdminPassword"
                                            value={currentAdminPassword}
                                            onChange={(e) => setCurrentAdminPassword(e.target.value)}
                                            placeholder="Masukkan password Anda saat ini"
                                            required={!!newAdminPassword} // Hanya required jika newAdminPassword diisi
                                            disabled={savingSettings}
                                        />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label htmlFor="newAdminPassword" className="form-label">Password Baru</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            id="newAdminPassword"
                                            value={newAdminPassword}
                                            onChange={(e) => setNewAdminPassword(e.target.value)}
                                            placeholder="Kosongkan jika tidak ingin mengubah password"
                                            disabled={savingSettings}
                                        />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label htmlFor="confirmNewAdminPassword" className="form-label">Konfirmasi Password Baru</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            id="confirmNewAdminPassword"
                                            value={confirmNewAdminPassword}
                                            onChange={(e) => setConfirmNewAdminPassword(e.target.value)}
                                            placeholder="Konfirmasi password baru Anda"
                                            required={!!newAdminPassword} // Hanya required jika newAdminPassword diisi
                                            disabled={savingSettings}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={savingSettings}>
                                {savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
                            </button>
                        </form>
                    </div>
                </div>
                 {/* Footer Admin */}
                 <footer className="sticky-footer bg-white">
                    <div className="container my-auto">
                        <div className="copyright text-center my-auto">
                            <span>Copyright &copy; Motor Rental 2024</span>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default SettingsAdmin;