// frontend/src/components/MotorAvailabilityCalendar.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../assets/css/style.css';
import '../assets/css/global.css';
import '../assets/css/motor-calendar.css';

const MotorAvailabilityCalendar = ({ motorId, onDateSelect }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [reservations, setReservations] = useState([]);
    const [selectedDates, setSelectedDates] = useState({ startDate: null, endDate: null, duration: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getApiUrl = () => {
        return import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';
    };

    // Fungsi untuk memformat tanggal ke format lokal yang mudah dibaca
    const formatDate = (date) => {
        if (!date) return '-';
        try {
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            if (isNaN(dateObj.getTime())) {
                throw new Error("Invalid Date object for formatDate");
            }
            return dateObj.toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            console.error("Error formatting date:", date, e);
            return typeof date === 'string' ? date : 'Invalid Date';
        }
    };

    // Fungsi untuk format tanggal ke format ISO (YYYY-MM-DD) yang diperlukan oleh API
    const formatDateToISO = (date) => {
        if (!date) return '';
        try {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) {
            console.error("Error formatting date to ISO:", date, e);
            return '';
        }
    };

    // Mengambil data reservasi untuk motor dan bulan tertentu
    // Dipicu hanya ketika motorId atau currentMonth berubah
    const fetchReservations = useCallback(async () => {
        if (!motorId) {
            setReservations([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

            const response = await axios.get(
                `${getApiUrl()}/api/motors/${motorId}/availability`,
                {
                    params: {
                        start_date: formatDateToISO(startOfMonth),
                        end_date: formatDateToISO(endOfMonth)
                    }
                }
            );
            setReservations(response.data.data.reservations || []);
        } catch (err) {
            console.error('Error fetching reservations for calendar:', err);
            setError('Gagal memuat jadwal motor. Silakan coba lagi.');
            setReservations([]);
        } finally {
            setLoading(false);
        }
    }, [motorId, currentMonth]); // Dependensi memastikan fetch hanya saat ini berubah

    // Memuat reservasi saat komponen pertama kali dimuat atau motorId/currentMonth berubah
    useEffect(() => {
        fetchReservations();
    }, [fetchReservations]);

    // Mendapatkan semua hari dalam bulan yang sedang ditampilkan
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay(); // 0 = Minggu, 6 = Sabtu

        const days = [];
        // Tambahkan placeholder untuk hari-hari sebelum tanggal 1
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        // Tambahkan hari-hari dalam bulan
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }
        return days;
    };

    // Mengecek apakah tanggal tertentu sudah dipesan/tidak tersedia
    const isDateReserved = useCallback((date) => {
        if (!date) return false;
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()); // Normalisasi tanggal

        return reservations.some(reservation => {
            const start = new Date(reservation.tanggal_mulai);
            const end = new Date(reservation.tanggal_selesai);
            start.setHours(0,0,0,0); // Normalisasi jam
            end.setHours(0,0,0,0);
            
            // Cek apakah targetDate berada di antara tanggal mulai dan tanggal selesai reservasi (inklusif)
            return targetDate >= start && targetDate <= end;
        });
    }, [reservations]);

    // Mengecek apakah tanggal tertentu sudah lewat (masa lalu)
    const isDateInPast = useCallback((date) => {
        if (!date) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalisasi jam untuk hari ini
        return date < today;
    }, []);

    // Mengecek apakah tanggal tertentu termasuk dalam rentang tanggal yang dipilih pengguna
    const isDateSelected = (date) => {
        if (!date || !selectedDates.startDate) return false;
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const start = new Date(selectedDates.startDate.getFullYear(), selectedDates.startDate.getMonth(), selectedDates.startDate.getDate());

        if (!selectedDates.endDate) {
            // Jika hanya tanggal mulai yang dipilih, hanya tanggal itu yang terpilih
            return targetDate.toDateString() === start.toDateString();
        }

        // Jika rentang tanggal dipilih, semua tanggal di antara start dan end (inklusif) terpilih
        const end = new Date(selectedDates.endDate.getFullYear(), selectedDates.endDate.getMonth(), selectedDates.endDate.getDate());
        return targetDate >= start && targetDate <= end;
    };

    // Mendapatkan semua tanggal dalam rentang tertentu
    const getDatesInRange = (start, end) => {
        const dates = [];
        let current = new Date(start);
        while (current <= end) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return dates;
    };

    // Handler ketika tanggal diklik di kalender
    const handleDateClick = useCallback((date) => {
        // Abaikan klik jika tanggal di masa lalu, sedang memuat, atau sudah dipesan
        if (!date || isDateInPast(date) || loading || isDateReserved(date)) {
            return;
        }

        console.log('=== CALENDAR DATE CLICK DEBUG ===');
        console.log('Clicked date:', date);
        console.log('Current selected dates:', selectedDates);

        // Pastikan tanggal yang dipilih tepat sesuai dengan yang diklik
        const clickedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        // Skenario 1: Belum ada tanggal dipilih ATAU rentang sudah lengkap (mulai pilihan baru)
        if (!selectedDates.startDate || (selectedDates.startDate && selectedDates.endDate)) {
            const newSelection = { 
                startDate: clickedDate, 
                endDate: null, // PENTING: Set endDate ke null untuk menunggu tanggal kedua
                duration: 1     // Durasi awal adalah 1 hari (tanggal mulai itu sendiri)
            };
            setSelectedDates(newSelection);
            
            // Kirim hanya startDate ke parent untuk saat ini.
            // onDateSelect akan memicu Index untuk memperbarui tanggal sewa dengan 1 hari.
            if (onDateSelect) {
                const payload = {
                    startDate: formatDateToISO(clickedDate),
                    endDate: null, // Kirim null untuk endDate karena rentang belum dipilih
                    duration: 1
                };
                console.log('DEBUG CALENDAR: Mengirim pilihan 1 hari (start saja) ke parent:', payload);
                onDateSelect(payload);
            }
            console.log('Setting new start date, waiting for end date:', newSelection);
            
        } else if (selectedDates.startDate && !selectedDates.endDate) {
            // Skenario 2: Tanggal mulai sudah ada, sekarang pilih tanggal akhir
            let start = new Date(selectedDates.startDate.getFullYear(), selectedDates.startDate.getMonth(), selectedDates.startDate.getDate());
            let end = clickedDate;

            // Jika tanggal akhir lebih kecil dari tanggal mulai, tukar posisi (agar start selalu lebih awal dari end)
            if (end < start) {
                [start, end] = [end, start];
            }
            
            const potentialDatesInSelection = getDatesInRange(start, end);
            
            // Cek apakah ada tanggal yang tidak tersedia (reserved/past) dalam rentang yang dipilih
            let firstUnavailableDate = null;
            for (let i = 0; i < potentialDatesInSelection.length; i++) {
                const d = potentialDatesInSelection[i];
                if (isDateReserved(d) || isDateInPast(d)) {
                    firstUnavailableDate = d;
                    break;
                }
            }

            if (firstUnavailableDate) {
                // Jika ada tanggal tidak tersedia, batasi rentang hingga sehari sebelum tanggal yang tidak tersedia itu
                const newEndDate = new Date(firstUnavailableDate);
                newEndDate.setDate(newEndDate.getDate() - 1);

                // Jika tanggal akhir yang baru lebih kecil dari tanggal mulai, itu berarti pilihan tidak valid
                if (newEndDate < start) {
                    alert('Rentang pilihan Anda melewati tanggal yang tidak tersedia atau sudah lewat. Mohon pilih rentang yang valid.');
                    // Reset ke pilihan tanggal mulai saja jika rentang tidak valid (tetap 1 hari dari tanggal klik)
                    const resetSelection = { startDate: clickedDate, endDate: null, duration: 1 };
                    setSelectedDates(resetSelection);
                    if (onDateSelect) { // Beri tahu parent bahwa pilihan reset
                        const payload = {
                            startDate: formatDateToISO(clickedDate),
                            endDate: null, // Tetap null jika direset ke pilihan 1 hari
                            duration: 1
                        };
                        console.log('DEBUG CALENDAR: Reset pilihan ke 1 hari karena rentang tidak valid:', payload);
                        onDateSelect(payload);
                    }
                    return;
                }

                // Hitung durasi dan set pilihan terbatas
                const finalDatesInSelection = getDatesInRange(start, newEndDate);
                const duration = finalDatesInSelection.length;
                const finalSelection = { startDate: start, endDate: newEndDate, duration };
                
                setSelectedDates(finalSelection);
                if (onDateSelect) {
                    const payload = {
                        startDate: formatDateToISO(start),
                        endDate: formatDateToISO(newEndDate),
                        duration
                    };
                    console.log('DEBUG CALENDAR: Mengirim pilihan rentang terbatas ke parent:', payload);
                    onDateSelect(payload);
                }
                
                if (duration < potentialDatesInSelection.length) {
                    alert(`Rentang pilihan Anda dibatasi karena ada motor yang tidak tersedia pada ${formatDate(firstUnavailableDate)}.`);
                }
                console.log('Setting limited range selection:', finalSelection);

            } else {
                // Jika tidak ada tanggal tidak tersedia dalam rentang, set rentang penuh
                const duration = potentialDatesInSelection.length;
                const finalSelection = { startDate: start, endDate: end, duration };
                
                setSelectedDates(finalSelection);
                if (onDateSelect) {
                    const payload = {
                        startDate: formatDateToISO(start),
                        endDate: formatDateToISO(end),
                        duration
                    };
                    console.log('DEBUG CALENDAR: Mengirim pilihan rentang penuh ke parent:', payload);
                    onDateSelect(payload);
                }
                console.log('Setting full range selection:', finalSelection);
            }
        }
    }, [selectedDates, loading, onDateSelect, isDateInPast, isDateReserved]);

    // Navigasi ke bulan berikutnya
    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
        // Bersihkan pilihan saat ganti bulan untuk menghindari bug visual
        setSelectedDates({ startDate: null, endDate: null, duration: 0 });
        onDateSelect(null); // Beri tahu parent bahwa pilihan dihapus
    };

    // Navigasi ke bulan sebelumnya
    const prevMonth = () => {
        const today = new Date();
        today.setHours(0,0,0,0);
        const prevMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        
        // Hanya izinkan navigasi ke bulan sebelumnya jika bukan bulan saat ini atau bulan yang sudah lewat
        if (prevMonthDate >= new Date(today.getFullYear(), today.getMonth(), 1)) {
            setCurrentMonth(prevMonthDate);
            // Bersihkan pilihan saat ganti bulan
            setSelectedDates({ startDate: null, endDate: null, duration: 0 });
            onDateSelect(null); // Beri tahu parent bahwa pilihan dihapus
        }
    };

    // Menghapus pilihan tanggal yang sedang aktif
    const clearSelection = () => {
        console.log('Clearing calendar selection');
        setSelectedDates({ startDate: null, endDate: null, duration: 0 });
        if (onDateSelect) {
            onDateSelect(null); // Beri tahu komponen parent bahwa tidak ada tanggal yang dipilih
        }
    };

    const days = getDaysInMonth(currentMonth);

    return (
        <div className="motor-calendar-container">
            <div className="calendar-header">
                <button onClick={prevMonth} className="calendar-nav-btn" 
                    disabled={loading || isDateInPast(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1))}>
                    ←
                </button>
                <h3 className="calendar-title">
                    {currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={nextMonth} className="calendar-nav-btn" disabled={loading}>
                    →
                </button>
            </div>

            {loading && (
                <div className="calendar-loading">
                    <div className="calendar-spinner"></div>
                </div>
            )}
            {error && (
                <div className="calendar-error">
                    {error}
                </div>
            )}

            <div className="calendar-days-of-week">
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                    <div key={day} className="day-of-week-label">
                        {day}
                    </div>
                ))}
            </div>

            <div className="calendar-grid">
                {days.map((date, index) => {
                    if (!date) {
                        return <div key={index} className="calendar-day-empty"></div>;
                    }

                    const isReserved = isDateReserved(date);
                    const isPast = isDateInPast(date);
                    const isSelected = isDateSelected(date);
                    const isClickable = !isReserved && !isPast;
                    
                    // Tambahkan styling khusus untuk tanggal mulai saat belum ada tanggal akhir
                    const isStartDateOnly = selectedDates.startDate && !selectedDates.endDate && 
                        date.toDateString() === selectedDates.startDate.toDateString();

                    const dayClass = `
                        calendar-day
                        ${isSelected ? 'calendar-day-selected' : ''}
                        ${isStartDateOnly ? 'calendar-day-start-only' : ''}
                        ${isReserved ? 'calendar-day-reserved' : ''}
                        ${isPast ? 'calendar-day-past' : ''}
                        ${isClickable ? 'calendar-day-clickable' : ''}
                    `;

                    return (
                        <button
                            key={index}
                            type="button" 
                            onClick={() => handleDateClick(date)}
                            disabled={!isClickable || loading}
                            className={dayClass}
                        >
                            {date.getDate()}
                        </button>
                    );
                })}
            </div>

            {selectedDates.startDate && (
                <div className="calendar-selection-info">
                    <div className="selection-text">
                        {!selectedDates.endDate ? ( // Menampilkan informasi saat hanya startDate yang dipilih
                            <>
                                <span className="selection-label">Tanggal Mulai:</span>
                                <span className="selection-value">
                                    {formatDate(selectedDates.startDate)}
                                </span>
                                <span className="selection-duration">
                                    (1 hari)
                                </span>
                                <div className="selection-hint">
                                    Klik tanggal lain untuk memilih rentang sewa
                                </div>
                            </>
                        ) : ( // Menampilkan informasi saat rentang sudah dipilih
                            <>
                                <span className="selection-label">Periode Dipilih:</span>
                                <span className="selection-value">
                                    {formatDate(selectedDates.startDate)}
                                </span>
                                <span className="selection-label">hingga</span>
                                <span className="selection-value">
                                    {formatDate(selectedDates.endDate)}
                                </span>
                                <span className="selection-duration">
                                    ({selectedDates.duration} hari)
                                </span>
                            </>
                        )}
                    </div>
                    <button
                        type="button" 
                        onClick={clearSelection}
                        className="clear-selection-btn"
                    >
                        Hapus Pilihan
                    </button>
                </div>
            )}

            <div className="calendar-legend">
                <div className="legend-item">
                    <span className="legend-color legend-color-selected"></span> Dipilih
                </div>
                <div className="legend-item">
                    <span className="legend-color legend-color-reserved"></span> Tidak Tersedia
                </div>
                <div className="legend-item">
                    <span className="legend-color legend-color-past"></span> Masa Lalu
                </div>
            </div>
        </div>
    );
};

export default MotorAvailabilityCalendar;
