// frontend/src/pages/admin/Dashboard.jsx

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Chart from 'chart.js/auto'; // Pastikan 'chart.js/auto' diimpor

import axios from 'axios'; // <<< PASTIKAN BARIS INI ADA DAN BENAR

// Import komponen Sidebar
import Sidebar from '../../components/admin/Sidebar.jsx';
// Import komponen Footer

// CSS yang relevan
import '../../assets/css/admin/dashboard.css';
import '../../assets/css/admin/sidebar.css';
import '../../assets/css/global.css';

const DashboardAdmin = () => {
    const [dashboardStats, setDashboardStats] = useState({
        totalUsers: 0,
        pendingRegistrations: 0,
        motorStatus: { available: 0, rented: 0, maintenance: 0 },
        totalReservations: 0,
        monthlyReservations: { labels: [], data: [] },
        totalPaymentsReceived: 0,
        pendingPayments: 0,
        approvedTestimonials: 0,
        userActivity: { labels: [], data: [] }
    });
    const [loadingStats, setLoadingStats] = useState(true); 
    const [error, setError] = useState(null); 

    // Refs untuk elemen canvas chart
    const areaChartRef = useRef(null);
    const pieChartRef = useRef(null);
    const barChartRef = useRef(null);

    const [isSidebarToggled, setIsSidebarToggled] = useState(false); 

    const navigate = useNavigate(); 

    const getApiUrl = () => {
        return import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';
    };

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

    const handleSidebarToggle = () => {
        setIsSidebarToggled(!isSidebarToggled);
    };


    // Fungsi untuk mengambil data statistik dari backend
    const fetchDashboardStats = useCallback(async () => {
        setLoadingStats(true);
        setError(null); // Reset error
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                // Jangan gunakan alert di sini, biarkan di catch
                throw new Error('Token tidak ditemukan. Silakan login kembali.');
            }

            // Menggunakan Axios untuk fetch data
            const response = await axios.get(`${getApiUrl()}/api/admin/dashboard/stats`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                timeout: 20000 // Timeout lebih lama untuk aggregated stats
            });
            
            console.log('DEBUG_FRONTEND: Raw API response data:', response.data); 
            console.log('DEBUG_FRONTEND: totalPaymentsReceived from API:', response.data.data.totalPaymentsReceived); 

            setDashboardStats(response.data.data);
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
            let errorMessage = 'Gagal mengambil statistik dashboard.';
            if (err.response) {
                // Error dari server (status code bukan 2xx)
                errorMessage = err.response.data?.message || `Server error: ${err.response.status}`;
                if (err.response.status === 401 || err.response.status === 403) {
                    alert('Sesi Anda berakhir atau tidak memiliki izin. Silakan login kembali.');
                    navigate('/login');
                } else {
                    alert(`Error: ${errorMessage}`);
                }
            } else if (err.request) {
                // Permintaan dibuat tapi tidak ada respons (misal, server tidak merespons)
                errorMessage = 'Tidak ada respons dari server. Periksa koneksi backend.';
                alert(`Error: ${errorMessage}`);
            } else {
                // Error lain (misal, masalah jaringan, atau error kustom dari throw new Error)
                errorMessage = err.message || 'Terjadi kesalahan yang tidak diketahui.';
                alert(`Error: ${errorMessage}`);
            }
            setError(errorMessage);
            
            // Set data default jika terjadi error untuk mencegah crash chart
            setDashboardStats({
                totalUsers: 0,
                pendingRegistrations: 0,
                motorStatus: { available: 0, rented: 0, maintenance: 0 },
                totalReservations: 0,
                monthlyReservations: { labels: [], data: [] },
                totalPaymentsReceived: 0,
                pendingPayments: 0,
                pendingTestimonials: 0,
                approvedTestimonials: 0,
                userActivity: { labels: [], data: [] }
            });

        } finally {
            setLoadingStats(false);
        }
    }, [navigate]);

    // useEffect untuk memicu fetch data saat komponen mount
    useEffect(() => {
        fetchDashboardStats();
    }, [fetchDashboardStats]);

    // Logging state setelah update
    useEffect(() => {
        if (!loadingStats && !error) { 
            console.log('DEBUG_FRONTEND: dashboardStats state updated:', dashboardStats);
            console.log('DEBUG_FRONTEND: totalPaymentsReceived in state (formatted by formatCurrency):', formatCurrency(dashboardStats.totalPaymentsReceived));
        }
    }, [dashboardStats, loadingStats, error]);


    // Inisialisasi Chart.js dan Animasi Angka
    useEffect(() => {
        // Hanya inisialisasi chart jika data sudah dimuat dan tidak ada error
        if (!dashboardStats || loadingStats || error) return;

        // Cleanup function untuk menghancurkan chart yang sudah ada
        const destroyCharts = () => {
            if (areaChartRef.current && areaChartRef.current.chart) areaChartRef.current.chart.destroy();
            if (pieChartRef.current && pieChartRef.current.chart) pieChartRef.current.chart.destroy();
            if (barChartRef.current && barChartRef.current.chart) barChartRef.current.chart.destroy();
        };
        destroyCharts(); // Hancurkan chart sebelumnya sebelum membuat yang baru

        // Area Chart (Reservasi Bulanan)
        if (areaChartRef.current) {
            areaChartRef.current.chart = new Chart(areaChartRef.current, {
                type: 'line',
                data: {
                    labels: dashboardStats.monthlyReservations.labels,
                    datasets: [{
                        label: 'Reservasi',
                        data: dashboardStats.monthlyReservations.data,
                        backgroundColor: 'rgba(78, 115, 223, 0.1)',
                        borderColor: 'rgba(78, 115, 223, 1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false } },
                        y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.1)' } }
                    }
                }
            });
        }

        // Pie Chart (Status Motor)
        if (pieChartRef.current) {
            pieChartRef.current.chart = new Chart(pieChartRef.current, {
                type: 'doughnut',
                data: {
                    labels: ['Tersedia', 'Disewa', 'Maintenance'],
                    datasets: [{
                        data: [dashboardStats.motorStatus.available, dashboardStats.motorStatus.rented, dashboardStats.motorStatus.maintenance],
                        backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc'],
                        hoverBorderColor: "rgba(234, 236, 244, 1)",
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    cutout: '60%'
                }
            });
        }

        // Bar Chart (Aktivitas Sistem)
        if (barChartRef.current) {
            barChartRef.current.chart = new Chart(barChartRef.current, {
                type: 'bar',
                data: {
                    labels: dashboardStats.userActivity.labels,
                    datasets: [{
                        label: 'Jumlah',
                        data: dashboardStats.userActivity.data,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)',
                            'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)',
                            'rgba(153, 102, 255, 0.6)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false } },
                        y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.1)' } }
                    }
                }
            });
        }

        const animateNumbers = () => {
            // Target semua elemen dengan class 'h5 mb-0 font-weight-bold text-gray-800'
            const numberElements = document.querySelectorAll('.h5.mb-0.font-weight-bold.text-gray-800');
        
            numberElements.forEach(element => {
                // Periksa apakah ini elemen "Pembayaran Masuk"
                // Untuk Pembayaran Masuk, langsung set teks yang sudah diformat
                // Ini menghindari animasi yang dapat merusak format Rupiah yang sudah benar
                if (element.id === 'totalPayments') {
                    element.textContent = formatCurrency(dashboardStats.totalPaymentsReceived);
                    return; 
                }

                // Untuk elemen angka lainnya, lanjutkan animasi
                const textContent = element.textContent;
                // Hapus semua non-digit kecuali titik atau koma yang digunakan untuk desimal
                const targetValue = parseFloat(textContent.replace(/[^0-9.,-]+/g,"").replace(/\./g, '').replace(/,/g, '.')); 
                
                if (isNaN(targetValue)) return; 
        
                let start = 0;
                const duration = 1000; // ms
                const startTime = performance.now();
        
                const step = (currentTime) => {
                    const progress = Math.min((currentTime - startTime) / duration, 1);
                    const animatedValue = progress * targetValue;
        
                    element.textContent = Math.floor(animatedValue).toLocaleString('id-ID'); // Format sebagai angka bulat dengan pemisah ribuan
        
                    if (progress < 1) {
                        requestAnimationFrame(step);
                    } else {
                        // Pastikan nilai akhir adalah nilai target yang diformat dengan benar
                        element.textContent = targetValue.toLocaleString('id-ID'); 
                    }
                };
        
                requestAnimationFrame(step);
            });
        };
        
        // Panggil animasi setelah chart diinisialisasi
        animateNumbers();

        // Cleanup: Hancurkan chart saat komponen di-unmount
        return () => {
            destroyCharts();
        };
    }, [dashboardStats, loadingStats, error]); // Dependensi

    // Format currency function (digunakan di JSX)
    const formatCurrency = (amount) => {
        // Memastikan input adalah angka dan menanganinya jika NaN
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount)) {
            return 'Rp 0';
        }

        // Gunakan Intl.NumberFormat dengan minimumFractionDigits: 0
        // Ini akan memformat seperti 340.000, 1.250.000
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0  
        }).format(numAmount);
    };

    // JSX untuk tampilan loading
    if (loadingStats) {
        return (
            <div id="wrapper" className={isSidebarToggled ? 'sidebar-toggled' : ''}>
                <Sidebar />
                <div id="content-wrapper" className="d-flex flex-column">
                    <div id="content">
                        <div className="loading-container">
                            <div className="loading-spinner">⏳</div>
                            <p>Memuat dashboard...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // JSX untuk tampilan error
    if (error) {
        return (
            <div id="wrapper" className={isSidebarToggled ? 'sidebar-toggled' : ''}>
                <Sidebar />
                <div id="content-wrapper" className="d-flex flex-column">
                    <div id="content">
                        <div className="container-fluid mt-4">
                            <div className="alert alert-danger" role="alert">
                                <h4 className="alert-heading">Error!</h4>
                                <p>{error}</p>
                                <hr />
                                <p className="mb-0">
                                    Silakan periksa log server backend Anda untuk detail lebih lanjut, atau coba refresh halaman.
                                </p>
                                <button className="btn btn-primary mt-3" onClick={fetchDashboardStats}>
                                    <i className="fas fa-sync-alt"></i> Coba Lagi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // JSX untuk tampilan utama setelah loading dan tanpa error
    return (
        <div id="wrapper" className={isSidebarToggled ? 'sidebar-toggled' : ''}>
            <Sidebar />

            <div id="content-wrapper" className="d-flex flex-column">
                <div id="content">

                    {/* Begin Page Content */}
                    <div className="container-fluid">
                        {/* Page Heading */}
                        <div className="d-sm-flex align-items-center justify-content-between mb-4">
                            <h1 className="h3 mb-0 text-gray-800">Dashboard</h1>
                            <button className="btn btn-primary btn-sm" onClick={fetchDashboardStats}>
                                <i className="fas fa-sync-alt"></i> Refresh Data
                            </button>
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
                                                <div className="h5 mb-0 font-weight-bold text-gray-800" id="totalUsers">
                                                    {dashboardStats.totalUsers}
                                                </div>
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
                                                <div className="h5 mb-0 font-weight-bold text-gray-800" id="totalMotors">
                                                    {dashboardStats.motorStatus.available}
                                                </div>
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
                                                        <div className="h5 mb-0 mr-3 font-weight-bold text-gray-800" id="totalReservations">
                                                            {dashboardStats.totalReservations}
                                                        </div>
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
                                                <div className="h5 mb-0 font-weight-bold text-gray-800" id="totalPayments">
                                                    {formatCurrency(dashboardStats.totalPaymentsReceived)}
                                                </div>
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
                                                <i className="fas fa-circle text-primary"></i> Tersedia ({dashboardStats.motorStatus.available})
                                            </span>
                                            <span className="mr-2">
                                                <i className="fas fa-circle text-success"></i> Disewa ({dashboardStats.motorStatus.rented})
                                            </span>
                                            <span className="mr-2">
                                                <i className="fas fa-circle text-info"></i> Maintenance ({dashboardStats.motorStatus.maintenance})
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
                                        <h6 className="m-0 font-weight-bold text-primary">Aktivitas Sistem</h6>
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
                                                <div className="h5 mb-0 font-weight-bold text-gray-800">
                                                    {dashboardStats.pendingRegistrations}
                                                </div>
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
                                                <div className="h5 mb-0 font-weight-bold text-gray-800">
                                                    {dashboardStats.pendingTestimonials}
                                                </div>
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
                                                <div className="h5 mb-0 font-weight-bold text-gray-800">
                                                    {dashboardStats.pendingPayments}
                                                </div>
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
                </div>
            </div>

            {/* Scroll to Top Button*/}
            <a className="scroll-to-top rounded" href="#page-top">
                <i className="fas fa-angle-up"></i>
            </a>
        </div>
    );
};

export default DashboardAdmin;