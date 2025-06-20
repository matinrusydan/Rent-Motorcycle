// frontend/src/pages/Tentang.jsx

import React, { useEffect, useRef } from 'react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import '../assets/css/tentang.css'; // Pastikan jalur impor CSS sesuai
import '../assets/css/global.css'; // Jika global.css diperlukan

const Tentang = () => {
    // Ref untuk section statistik agar bisa diobservasi
    const statsSectionRef = useRef(null);

    // useEffect untuk animasi counter saat section statistik terlihat
    useEffect(() => {
        const animateCounters = () => {
            const counters = document.querySelectorAll('.stat-number');
            
            counters.forEach(counter => {
                const target = parseInt(counter.textContent.replace(/\D/g, ''));
                const suffix = counter.textContent.replace(/\d/g, ''); // Ambil suffix seperti '+'
                let current = 0;
                const increment = target / 50; 
                
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        counter.textContent = target + suffix;
                        clearInterval(timer);
                    } else {
                        counter.textContent = Math.floor(current) + suffix;
                    }
                }, 40); 
            });
        };

        // Intersection Observer untuk mendeteksi kapan section terlihat
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounters();
                    observer.unobserve(entry.target); // Berhenti mengamati setelah animasi berjalan
                }
            });
        }, { threshold: 0.5 }); // Trigger saat 50% elemen terlihat

        if (statsSectionRef.current) {
            observer.observe(statsSectionRef.current);
        }

        // Cleanup observer saat komponen di-unmount
        return () => {
            if (statsSectionRef.current) {
                observer.unobserve(statsSectionRef.current);
            }
        };
    }, []); // Array dependensi kosong berarti hanya berjalan sekali saat mount

    return (
        <>
            <Header /> {/* Komponen Header */}

            {/* Hero Section */}
            <section className="about-hero">
                <div className="container">
                    <div className="hero-content">
                        <h1>Tentang Kami</h1>
                        <p>Melayani rental motor terpercaya sejak 2018 dengan komitmen memberikan pelayanan terbaik untuk perjalanan Anda</p>
                    </div>
                </div>
            </section>

            {/* Story Section */}
            <section className="story-section">
                <div className="container">
                    <div className="story-content">
                        <div className="story-text">
                            <h2>Cerita Kami</h2>
                            <p>Berawal dari kebutuhan akan transportasi yang mudah dan terjangkau, kami mendirikan rental motor pada tahun 2018. Dengan visi menjadi penyedia layanan rental motor terpercaya, kami terus berkembang dan melayani ribuan pelanggan di seluruh Indonesia.</p>
                            <p>Perjalanan kami dimulai dengan 5 unit motor dan kini telah berkembang menjadi lebih dari 200 unit dengan berbagai tipe dan merk terkemuka seperti Honda, Yamaha, dan Suzuki.</p>
                        </div>
                        <div className="story-image">
                            <div className="image-placeholder">🏢</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Vision Mission Section */}
            <section className="vision-mission">
                <div className="container">
                    <div className="vm-grid">
                        <div className="vm-card">
                            <div className="vm-icon">👁️</div>
                            <h3>Visi</h3>
                            <p>Menjadi penyedia layanan rental motor terdepan dan terpercaya di Indonesia yang memberikan kemudahan mobilitas bagi semua kalangan.</p>
                        </div>
                        <div className="vm-card">
                            <div className="vm-icon">🎯</div>
                            <h3>Misi</h3>
                            <p>Memberikan layanan rental motor berkualitas dengan harga terjangkau, proses yang mudah, dan customer service yang responsif untuk kepuasan pelanggan.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="values-section">
                <div className="container">
                    <h2>Nilai-Nilai Kami</h2>
                    <div className="values-grid">
                        <div className="value-card">
                            <div className="value-icon">🛡️</div>
                            <h4>Kepercayaan</h4>
                            <p>Membangun kepercayaan melalui transparansi dan konsistensi dalam setiap layanan yang kami berikan.</p>
                        </div>
                        <div className="value-card">
                            <div className="value-icon">⚡</div>
                            <h4>Kecepatan</h4>
                            <p>Proses reservasi yang cepat dan efisien untuk menghemat waktu berharga Anda.</p>
                        </div>
                        <div className="value-card">
                            <div className="value-icon">✨</div>
                            <h4>Kualitas</h4>
                            <p>Motor-motor berkualitas tinggi yang selalu terawat dan dalam kondisi prima.</p>
                        </div>
                        <div className="value-card">
                            <div className="value-icon">💎</div>
                            <h4>Pelayanan</h4>
                            <p>Customer service yang ramah dan profesional siap membantu 24/7.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section" ref={statsSectionRef}>
                <div className="container">
                    <div className="stats-grid">
                        <div className="stat-card">
                            <span className="stat-number">5000+</span> {/* Nilai akan dianimasikan oleh JS */}
                            <div className="stat-label">Pelanggan Puas</div>
                        </div>
                        <div className="stat-card">
                            <span className="stat-number">200+</span>
                            <div className="stat-label">Unit Motor</div>
                        </div>
                        <div className="stat-card">
                            <span className="stat-number">7</span>
                            <div className="stat-label">Tahun Pengalaman</div>
                        </div>
                        <div className="stat-card">
                            <span className="stat-number">15+</span>
                            <div className="stat-label">Kota Terjangkau</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Choose Us Section */}
            <section className="why-choose-section">
                <div className="container">
                    <h2>Mengapa Memilih Kami?</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">📱</div>
                            <h4>Booking Online Mudah</h4>
                            <p>Sistem reservasi online yang mudah dan user-friendly, bisa diakses kapan saja.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">💰</div>
                            <h4>Harga Terjangkau</h4>
                            <p>Tarif kompetitif dengan berbagai paket hemat untuk kebutuhan rental jangka panjang.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🔧</div>
                            <h4>Motor Terawat</h4>
                            <p>Semua motor menjalani maintenance rutin dan pengecekan berkala untuk performa optimal.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🚀</div>
                            <h4>Proses Cepat</h4>
                            <p>Proses verifikasi dan pengambilan motor yang cepat, tanpa birokrasi yang rumit.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🛡️</div>
                            <h4>Asuransi Terjamin</h4>
                            <p>Semua unit motor dilengkapi dengan asuransi untuk keamanan dan ketenangan pikiran.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">📞</div>
                            <h4>Support 24/7</h4>
                            <p>Tim customer service siap membantu Anda kapan saja melalui berbagai channel komunikasi.</p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer /> {/* Komponen Footer */}
        </>
    );
};

export default Tentang;