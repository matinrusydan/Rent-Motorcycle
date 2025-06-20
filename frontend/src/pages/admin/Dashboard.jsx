// frontend/src/pages/admin/Dashboard.jsx

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Chart from 'chart.js/auto';

// Impor komponen Sidebar yang baru
import Sidebar from '../../components/admin/Sidebar.jsx'; 

// CSS yang relevan
import '../../assets/css/admin/dashboard.css'; 
import '../../assets/css/admin/sidebar.css';   
import '../../assets/css/global.css';         


// Data Chart (diambil dari js/admin/dashboard.js)
const chartData = {
    monthlyReservations: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        data: [12, 19, 8, 15, 22, 18, 25, 28, 32, 24, 18, 15]
    },
    motorStatus: {
        labels: ['Tersedia', 'Disewa', 'Maintenance'],
        data: [28, 15, 5],
        colors: ['#4e73df', '#1cc88a', '#36b9cc']
    },
    userActivity: {
        labels: ['Testimoni Pending', 'Testimoni Approved', 'User Aktif', 'User Baru', 'Pembayaran Sukses'],
        data: [8, 45, 156, 23, 89]
    }
};

const DashboardAdmin = () => {
    // Refs untuk elemen canvas chart
    const areaChartRef = useRef(null);
    const pieChartRef = useRef(null);
    const barChartRef = useRef(null);

    const [isSidebarToggled, setIsSidebarToggled] = useState(false); // State untuk mengontrol sidebar

    // useEffect untuk inisialisasi chart dan animasi statistik
    useEffect(() => {
        const initializeCharts = () => {
            if (areaChartRef.current) {
                if (areaChartRef.current.chart) {
                    areaChartRef.current.chart.destroy();
                }
                areaChartRef.current.chart = new Chart(areaChartRef.current, {
                    type: 'line', data: { labels: chartData.monthlyReservations.labels, datasets: [{
                        label: 'Reservasi', data: chartData.monthlyReservations.data, backgroundColor: 'rgba(78, 115, 223, 0.1)',
                        borderColor: 'rgba(78, 115, 223, 1)', borderWidth: 2, fill: true, tension: 0.3
                    }]},
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }},
                        scales: { x: { grid: { display: false }}, y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.1)' }}}
                    }
                });
            }

            if (pieChartRef.current) {
                if (pieChartRef.current.chart) {
                    pieChartRef.current.chart.destroy();
                }
                pieChartRef.current.chart = new Chart(pieChartRef.current, {
                    type: 'doughnut', data: { labels: chartData.motorStatus.labels, datasets: [{
                        data: chartData.motorStatus.data, backgroundColor: chartData.motorStatus.colors,
                        hoverBorderColor: "rgba(234, 236, 244, 1)", borderWidth: 2
                    }]},
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }}, cutout: '60%'
                    }
                });
            }

            if (barChartRef.current) {
                if (barChartRef.current.chart) {
                    barChartRef.current.chart.destroy();
                }
                barChartRef.current.chart = new Chart(barChartRef.current, {
                    type: 'bar', data: { labels: chartData.userActivity.labels, datasets: [{
                        label: 'Jumlah', data: chartData.userActivity.data, backgroundColor: [
                            'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)',
                            'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)',
                            'rgba(153, 102, 255, 0.6)'
                        ], borderColor: [
                            'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)'
                        ], borderWidth: 1
                    }]},
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }},
                        scales: { x: { grid: { display: false }}, y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.1)' }}}
                    }
                });
            }
        };

        const animateNumbers = () => {
            const numbers = document.querySelectorAll('.h5.mb-0.font-weight-bold.text-gray-800');
            numbers.forEach(function(number) {
                const text = number.textContent;
                const numericValue = parseInt(text.replace(/\D/g, ''));
                if (numericValue && numericValue > 0) {
                    let currentValue = 0; const increment = numericValue / 50;
                    const timer = setInterval(function() {
                        currentValue += increment;
                        if (currentValue >= numericValue) { currentValue = numericValue; clearInterval(timer); }
                        if (text.includes('Rp')) { number.textContent = 'Rp ' + Math.floor(currentValue).toLocaleString('id-ID');
                        } else { number.textContent = Math.floor(currentValue); }
                    }, 20);
                }
            });
        };

        setTimeout(() => { initializeCharts(); animateNumbers(); }, 500);
        return () => {
            if (areaChartRef.current && areaChartRef.current.chart) areaChartRef.current.chart.destroy();
            if (pieChartRef.current && pieChartRef.current.chart) pieChartRef.current.chart.destroy();
            if (barChartRef.current && barChartRef.current.chart) barChartRef.current.chart.destroy();
        };
    }, []);

    // useEffect untuk mengelola kelas 'sidebar-toggled' pada body
    useEffect(() => {
        // Logika utama untuk menambah/menghapus kelas pada elemen <body>
        if (isSidebarToggled) {
            document.body.classList.add('sidebar-toggled');
        } else {
            document.body.classList.remove('sidebar-toggled');
        }

        // Logika untuk mengatur status sidebar berdasarkan ukuran layar (responsif)
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsSidebarToggled(true); // Tutup sidebar secara default di layar kecil
            } else {
                setIsSidebarToggled(false); // Buka sidebar di layar besar
            }
        };

        // Tambahkan event listener untuk resize dan panggil saat mount
        window.addEventListener('resize', handleResize);
        handleResize(); // Panggil saat mount untuk set status awal

        // Cleanup function saat komponen di-unmount
        return () => {
            window.removeEventListener('resize', handleResize);
            document.body.classList.remove('sidebar-toggled'); // Pastikan dihapus saat unmount
        };
    }, [isSidebarToggled]); // isSidebarToggled sebagai dependensi

    const handleSidebarToggle = () => {
        setIsSidebarToggled(!isSidebarToggled);
    };

    return (
        // Wrapper div utama, kelas sidebar-toggled dikontrol oleh state
        <div id="wrapper">
            {/* Sidebar Komponen */}
            <Sidebar /> {/* ✅ Gunakan komponen Sidebar di sini */}

            {/* Content Wrapper */}
            {/* Class 'toggled' atau 'active-sidebar' harus sesuai dengan CSS admin Anda untuk menggeser konten */}
            <div id="content-wrapper" className={`d-flex flex-column ${isSidebarToggled ? 'toggled' : ''}`}> 
                {/* Main Content */}
                <div id="content">
                    {/* Topbar */}
                    <nav className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow">
                        {/* Tombol Sidebar Toggle (untuk mobile) */}
                        {/* Kelas d-md-none dan mr-3 dari Bootstrap/AdminLTE */}
                        <button id="sidebarToggleTop" className="btn btn-link d-md-none rounded-circle mr-3" onClick={handleSidebarToggle}>
                            <i className="fa fa-bars"></i>
                        </button>
                        
                        {/* Topbar Navbar */}
                        <ul className="navbar-nav ml-auto">
                            {/* Nav Item - User Information */}
                            <li className="nav-item dropdown no-arrow">
                                <a className="nav-link dropdown-toggle" href="#" id="userDropdown" role="button"
                                    data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    <span className="mr-2 d-none d-lg-inline text-gray-600 small">Admin</span>
                                    <img className="img-profile rounded-circle"
                                        src="http://via.placeholder.com/40x40" alt="Profile" /> {/* ✅ Perbaikan URL gambar */}
                                </a>
                                {/* Dropdown - User Information */}
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
                    {/* End of Topbar */}

                    {/* Begin Page Content */}
                    <div className="container-fluid">
                        {/* Page Heading */}
                        <div className="d-sm-flex align-items-center justify-content-between mb-4">
                            <h1 className="h3 mb-0 text-gray-800">Dashboard</h1>
                        </div>

                        {/* Content Row - Statistics Cards */}
                        <div className="row">
                            {/* User Terdaftar Card */}
                            <div className="col-xl-3 col-md-6 mb-4">
                                <div className="card border-left-primary shadow h-100 py-2">
                                    <div className="card-body">
                                        <div className="row no-gutters align-items-center">
                                            <div className="col mr-2">
                                                <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                                    User Terdaftar</div>
                                                <div className="h5 mb-0 font-weight-bold text-gray-800" id="totalUsers">245</div>
                                            </div>
                                            <div className="col-auto">
                                                <i className="fas fa-users fa-2x text-gray-300"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Motor Tersedia Card */}
                            <div className="col-xl-3 col-md-6 mb-4">
                                <div className="card border-left-success shadow h-100 py-2">
                                    <div className="card-body">
                                        <div className="row no-gutters align-items-center">
                                            <div className="col mr-2">
                                                <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                                                    Motor Tersedia</div>
                                                <div className="h5 mb-0 font-weight-bold text-gray-800" id="totalMotors">48</div>
                                            </div>
                                            <div className="col-auto">
                                                <i className="fas fa-motorcycle fa-2x text-gray-300"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Reservasi Berhasil Card */}
                            <div className="col-xl-3 col-md-6 mb-4">
                                <div className="card border-left-info shadow h-100 py-2">
                                    <div className="card-body">
                                        <div className="row no-gutters align-items-center">
                                            <div className="col mr-2">
                                                <div className="text-xs font-weight-bold text-info text-uppercase mb-1">Reservasi Berhasil
                                                </div>
                                                <div className="row no-gutters align-items-center">
                                                    <div className="col-auto">
                                                        <div className="h5 mb-0 mr-3 font-weight-bold text-gray-800" id="totalReservations">156</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-auto">
                                                <i className="fas fa-calendar-check fa-2x text-gray-300"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Pembayaran Masuk Card */}
                            <div className="col-xl-3 col-md-6 mb-4">
                                <div className="card border-left-warning shadow h-100 py-2">
                                    <div className="card-body">
                                        <div className="row no-gutters align-items-center">
                                            <div className="col mr-2">
                                                <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                                    Pembayaran Masuk</div>
                                                <div className="h5 mb-0 font-weight-bold text-gray-800" id="totalPayments">Rp 15.750.000</div>
                                            </div>
                                            <div className="col-auto">
                                                <i className="fas fa-dollar-sign fa-2x text-gray-300"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Row - Charts */}
                        <div className="row">
                            {/* Area Chart */}
                            <div className="col-xl-8 col-lg-7">
                                <div className="card shadow mb-4">
                                    <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                                        <h6 className="m-0 font-weight-bold text-primary">Statistik Reservasi Bulanan</h6>
                                    </div>
                                    <div className="card-body">
                                        <div className="chart-area">
                                            <canvas ref={areaChartRef} id="myAreaChart"></canvas>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Pie Chart */}
                            <div className="col-xl-4 col-lg-5">
                                <div className="card shadow mb-4">
                                    <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                                        <h6 className="m-0 font-weight-bold text-primary">Status Motor</h6>
                                    </div>
                                    <div className="card-body">
                                        <div className="chart-pie pt-4 pb-2">
                                            <canvas ref={pieChartRef} id="myPieChart"></canvas>
                                        </div>
                                        <div className="mt-4 text-center small">
                                            <span className="mr-2">
                                                <i className="fas fa-circle text-primary"></i> Tersedia
                                            </span>
                                            <span className="mr-2">
                                                <i className="fas fa-circle text-success"></i> Disewa
                                            </span>
                                            <span className="mr-2">
                                                <i className="fas fa-circle text-info"></i> Maintenance
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Row - Bar Chart & Pending Actions */}
                        <div className="row">
                            {/* Bar Chart */}
                            <div className="col-xl-8 col-lg-7">
                                <div className="card shadow mb-4">
                                    <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                                        <h6 className="m-0 font-weight-bold text-primary">Testimoni & Aktivitas User</h6>
                                    </div>
                                    <div className="card-body">
                                        <div className="chart-bar">
                                            <canvas ref={barChartRef} id="myBarChart"></canvas>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Pending Actions Card */}
                            <div className="col-xl-4 col-lg-5">
                                <div className="card shadow mb-4">
                                    <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                                        <h6 className="m-0 font-weight-bold text-primary">Pending Actions</h6>
                                    </div>
                                    <div className="card-body">
                                        <div className="row no-gutters align-items-center mb-3">
                                            <div className="col mr-2">
                                                <div className="text-xs font-weight-bold text-uppercase mb-1">
                                                    Pending Registrasi</div>
                                                <div className="h5 mb-0 font-weight-bold text-gray-800">12</div>
                                            </div>
                                            <div className="col-auto">
                                                <Link to="/admin/pending-registrasi" className="btn btn-primary btn-sm">
                                                    <i className="fas fa-eye"></i> Lihat
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="row no-gutters align-items-center mb-3">
                                            <div className="col mr-2">
                                                <div className="text-xs font-weight-bold text-uppercase mb-1">
                                                    Testimoni Menunggu</div>
                                                <div className="h5 mb-0 font-weight-bold text-gray-800">8</div>
                                            </div>
                                            <div className="col-auto">
                                                <Link className="btn btn-warning btn-sm" to="/admin/testimoni">
                                                    <i className="fas fa-eye"></i> Lihat
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="row no-gutters align-items-center">
                                            <div className="col mr-2">
                                                <div className="text-xs font-weight-bold text-uppercase mb-1">
                                                    Pembayaran Pending</div>
                                                <div className="h5 mb-0 font-weight-bold text-gray-800">5</div>
                                            </div>
                                            <div className="col-auto">
                                                <Link className="btn btn-info btn-sm" to="/admin/pembayaran">
                                                    <i className="fas fa-eye"></i> Lihat
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* /.container-fluid */}
                </div>
                {/* End of Main Content */}

                {/* Footer Admin */}
                <footer className="sticky-footer bg-white">
                    <div className="container my-auto">
                        <div className="copyright text-center my-auto">
                            <span>Copyright &copy; Motor Rental 2024</span>
                        </div>
                    </div>
                </footer>
                {/* End of Footer Admin */}
            </div>
            {/* End of Content Wrapper */}

            {/* Scroll to Top Button*/}
            <a className="scroll-to-top rounded" href="#page-top">
                <i className="fas fa-angle-up"></i>
            </a>
        </div>
    );
};

export default DashboardAdmin;