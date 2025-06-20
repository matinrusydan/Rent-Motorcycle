// frontend/src/pages/admin/TestimoniAdmin.jsx

import React, { useState} from 'react';
import { Link } from 'react-router-dom';
// ✅ Ingat: Halaman admin TIDAK mengimpor Header dan Footer dari komponen utama situs.
// Mereka seharusnya menggunakan layout admin tersendiri (misal: AdminLayout atau struktur DashboardAdmin).

// CSS yang relevan
import '../../assets/css/admin/dashboard.css'; // Untuk gaya admin umum
// Anda mungkin juga perlu CSS khusus testimoni admin jika ada
// import '../../assets/css/testimoni.css'; // Contoh jika ada
import '../../assets/css/global.css';

const TestimoniAdmin = () => {
    // State untuk daftar testimoni (dummy data untuk demo)
    const [testimonials, setTestimonials] = useState([
        {
            id: 1,
            nama: 'Budi Santoso',
            text: 'Pelayanan sangat memuaskan! Motor dalam kondisi prima dan proses sewa sangat mudah. Harga juga terjangkau.',
            rating: '⭐⭐⭐⭐⭐',
            status: 'pending',
            tanggal: '2025-06-19',
            email: 'budi.s@example.com'
        },
        {
            id: 2,
            nama: 'Siti Rahayu',
            text: 'Sudah beberapa kali sewa di sini, selalu puas. Motor bersih, bensin selalu full, dan staffnya ramah.',
            rating: '⭐⭐⭐⭐⭐',
            status: 'approved',
            tanggal: '2025-06-18',
            email: 'siti.r@example.com'
        },
        {
            id: 3,
            nama: 'Ahmad Fauzi',
            text: 'Recommended banget! Proses cepat, tidak ribet, dan motornya bagus-bagus semua.',
            rating: '⭐⭐⭐⭐⭐',
            status: 'pending',
            tanggal: '2025-06-17',
            email: 'ahmad.f@example.com'
        },
        {
            id: 4,
            nama: 'Dewi Kartika',
            text: 'Pertama kali sewa motor online, ternyata mudah sekali. Terima kasih RentalMotor!',
            rating: '⭐⭐⭐⭐⭐',
            status: 'rejected',
            tanggal: '2025-06-16',
            email: 'dewi.k@example.com'
        }
    ]);

    // State untuk filter dan pencarian
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Fungsi untuk memfilter data testimoni
    const filteredTestimonials = testimonials.filter(item => {
        const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
        const matchesSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              item.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // Fungsi untuk mendapatkan badge status
    const getStatusBadge = (status) => {
        const badges = {
            pending: { text: 'Menunggu', class: 'badge bg-warning text-dark' },
            approved: { text: 'Disetujui', class: 'badge bg-success' },
            rejected: { text: 'Ditolak', class: 'badge bg-danger' }
        };
        return badges[status] || badges.pending;
    };

    // Fungsi untuk mengubah status testimoni (simulasi)
    const handleStatusChange = (id, newStatus) => {
        // Di sini Anda akan mengirim permintaan ke backend untuk update status testimoni
        console.log(`Mengubah status testimoni ${id} menjadi ${newStatus}`);
        setTestimonials(testimonials.map(t =>
            t.id === id ? { ...t, status: newStatus } : t
        ));
        // Contoh:
        // axios.put(`/api/admin/testimonials/${id}/status`, { status: newStatus }, {
        //     headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        // });
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
                            <h1 className="h3 mb-0 text-gray-800">Manajemen Testimoni</h1>
                        </div>

                        {/* Filter dan Search */}
                        <div className="card shadow mb-4">
                            <div className="card-body">
                                <div className="admin-controls">
                                    <div className="search-group">
                                        <input
                                            type="text"
                                            placeholder="Cari nama atau isi testimoni..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="form-control"
                                        />
                                    </div>
                                    <div className="filter-group">
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="form-select"
                                        >
                                            <option value="all">Semua Status</option>
                                            <option value="pending">Menunggu</option>
                                            <option value="approved">Disetujui</option>
                                            <option value="rejected">Ditolak</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabel Testimoni */}
                        <div className="card shadow mb-4">
                            <div className="card-header py-3">
                                <h6 className="m-0 font-weight-bold text-primary">Daftar Testimoni</h6>
                            </div>
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table table-bordered" width="100%" cellSpacing="0">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Nama</th>
                                                <th>Isi Testimoni</th>
                                                <th>Rating</th>
                                                <th>Tanggal</th>
                                                <th>Status</th>
                                                <th>Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredTestimonials.length > 0 ? (
                                                filteredTestimonials.map(t => {
                                                    const statusBadge = getStatusBadge(t.status);
                                                    return (
                                                        <tr key={t.id}>
                                                            <td>{t.id}</td>
                                                            <td>{t.nama}</td>
                                                            <td>{t.text}</td>
                                                            <td>{t.rating}</td>
                                                            <td>{t.tanggal}</td>
                                                            <td>
                                                                <span className={statusBadge.class}>
                                                                    {statusBadge.text}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {t.status === 'pending' && (
                                                                    <>
                                                                        <button 
                                                                            className="btn btn-success btn-sm me-2"
                                                                            onClick={() => handleStatusChange(t.id, 'approved')}
                                                                        >
                                                                            Setujui
                                                                        </button>
                                                                        <button 
                                                                            className="btn btn-danger btn-sm"
                                                                            onClick={() => handleStatusChange(t.id, 'rejected')}
                                                                        >
                                                                            Tolak
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {/* Aksi lain untuk status approved/rejected jika diperlukan */}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan="7" className="text-center">Tidak ada data testimoni.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
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

export default TestimoniAdmin;