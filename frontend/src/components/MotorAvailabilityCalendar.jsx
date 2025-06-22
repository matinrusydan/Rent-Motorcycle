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

    // FIXED: Function untuk format tanggal ke format YYYY-MM-DD dengan timezone yang benar
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
    }, [motorId, currentMonth]);

    useEffect(() => {
        fetchReservations();
    }, [fetchReservations]);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }
        return days;
    };

    const isDateReserved = useCallback((date) => {
        if (!date) return false;
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        return reservations.some(reservation => {
            const start = new Date(reservation.tanggal_mulai);
            const end = new Date(reservation.tanggal_selesai);
            start.setHours(0,0,0,0);
            end.setHours(0,0,0,0);
            
            return targetDate >= start && targetDate <= end;
        });
    }, [reservations]);

    const isDateInPast = useCallback((date) => {
        if (!date) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    }, []);

    const isDateSelected = (date) => {
        if (!date || !selectedDates.startDate) return false;
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const start = new Date(selectedDates.startDate.getFullYear(), selectedDates.startDate.getMonth(), selectedDates.startDate.getDate());

        if (!selectedDates.endDate) {
            return targetDate.toDateString() === start.toDateString();
        }

        const end = new Date(selectedDates.endDate.getFullYear(), selectedDates.endDate.getMonth(), selectedDates.endDate.getDate());
        return targetDate >= start && targetDate <= end;
    };

    const getDatesInRange = (start, end) => {
        const dates = [];
        let current = new Date(start);
        while (current <= end) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return dates;
    };

    // FIXED: Handler klik tanggal yang diperbaiki untuk memungkinkan rentang lebih dari 1 hari
    const handleDateClick = useCallback((date) => {
        if (!date || isDateInPast(date) || loading || isDateReserved(date)) return;

        console.log('=== CALENDAR DATE CLICK DEBUG ===');
        console.log('Clicked date:', date);
        console.log('Current selected dates:', selectedDates);

        // FIXED: Pastikan tanggal yang dipilih tepat sesuai dengan yang diklik
        const clickedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        if (!selectedDates.startDate || (selectedDates.startDate && selectedDates.endDate)) {
            // FIXED: Memulai pilihan baru - hanya set startDate tanpa endDate
            const newSelection = { 
                startDate: clickedDate, 
                endDate: null,  // Jangan set endDate di sini
                duration: 0 
            };
            
            console.log('Setting new start date:', newSelection);
            setSelectedDates(newSelection);
            
        } else if (selectedDates.startDate && !selectedDates.endDate) {
            // Sudah ada tanggal mulai, sekarang pilih tanggal akhir
            let start = new Date(selectedDates.startDate.getFullYear(), selectedDates.startDate.getMonth(), selectedDates.startDate.getDate());
            let end = clickedDate;

            // Jika tanggal akhir lebih kecil dari tanggal mulai, swap
            if (end < start) {
                [start, end] = [end, start];
            }
            
            const potentialDatesInSelection = getDatesInRange(start, end);
            
            // Cek apakah ada tanggal yang tidak tersedia dalam rentang
            let firstUnavailableDate = null;
            for (let i = 0; i < potentialDatesInSelection.length; i++) {
                const d = potentialDatesInSelection[i];
                if (isDateReserved(d) || isDateInPast(d)) {
                    firstUnavailableDate = d;
                    break;
                }
            }

            if (firstUnavailableDate) {
                // Batasi rentang jika ada tanggal tidak tersedia
                const newEndDate = new Date(firstUnavailableDate);
                newEndDate.setDate(newEndDate.getDate() - 1);

                if (newEndDate < start) {
                    alert('Tanggal mulai pilihan Anda terlalu dekat dengan tanggal yang tidak tersedia. Mohon pilih tanggal mulai yang berbeda.');
                    // Reset ke single date selection
                    const resetSelection = { startDate: clickedDate, endDate: null, duration: 0 };
                    setSelectedDates(resetSelection);
                    return;
                }

                const finalDatesInSelection = getDatesInRange(start, newEndDate);
                const duration = finalDatesInSelection.length;
                const finalSelection = { startDate: start, endDate: newEndDate, duration };
                
                console.log('Setting limited range selection:', finalSelection);
                setSelectedDates(finalSelection);
                
                setTimeout(() => {
                    if (onDateSelect) {
                        console.log('Sending limited range to parent:', {
                            startDate: formatDateToISO(start),
                            endDate: formatDateToISO(newEndDate),
                            duration
                        });
                        onDateSelect({
                            startDate: formatDateToISO(start),
                            endDate: formatDateToISO(newEndDate),
                            duration
                        });
                    }
                }, 10);
                
                if (duration < potentialDatesInSelection.length) {
                    alert(`Rentang pilihan Anda dibatasi karena ada motor yang tidak tersedia pada ${formatDate(firstUnavailableDate)}.`);
                }
            } else {
                // Rentang penuh tersedia
                const duration = potentialDatesInSelection.length;
                const finalSelection = { startDate: start, endDate: end, duration };
                
                console.log('Setting full range selection:', finalSelection);
                setSelectedDates(finalSelection);
                
                setTimeout(() => {
                    if (onDateSelect) {
                        console.log('Sending full range to parent:', {
                            startDate: formatDateToISO(start),
                            endDate: formatDateToISO(end),
                            duration
                        });
                        onDateSelect({
                            startDate: formatDateToISO(start),
                            endDate: formatDateToISO(end),
                            duration
                        });
                    }
                }, 10);
            }
        }
    }, [selectedDates, loading, onDateSelect, isDateInPast, isDateReserved]);

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        const today = new Date();
        today.setHours(0,0,0,0);
        const prevMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        
        if (prevMonthDate >= new Date(today.getFullYear(), today.getMonth(), 1)) {
            setCurrentMonth(prevMonthDate);
        }
    };

    const clearSelection = () => {
        console.log('Clearing calendar selection');
        setSelectedDates({ startDate: null, endDate: null, duration: 0 });
        if (onDateSelect) {
            onDateSelect(null);
        }
    };

    const days = getDaysInMonth(currentMonth);

    return (
        <div className="motor-calendar-container">
            <div className="calendar-header">
                <button onClick={prevMonth} className="calendar-nav-btn" disabled={loading || isDateInPast(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1))}>
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
                    
                    // FIXED: Tambahkan styling khusus untuk tanggal mulai saat belum ada tanggal akhir
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
                        {!selectedDates.endDate ? (
                            <>
                                <span className="selection-label">Tanggal Mulai:</span>
                                <span className="selection-value">
                                    {formatDate(selectedDates.startDate)}
                                </span>
                                <div className="selection-hint">
                                    Klik tanggal lain untuk memilih rentang sewa
                                </div>
                            </>
                        ) : (
                            <>
                                <span className="selection-label">Periode Dipilih:</span>
                                <span className="selection-value">
                                    {formatDate(selectedDates.startDate)}
                                </span>
                                {selectedDates.startDate.toDateString() !== selectedDates.endDate.toDateString() && (
                                    <>
                                        <span className="selection-label">hingga</span>
                                        <span className="selection-value">
                                            {formatDate(selectedDates.endDate)}
                                        </span>
                                        <span className="selection-duration">
                                            ({selectedDates.duration} hari)
                                        </span>
                                    </>
                                )}
                                {selectedDates.duration === 1 && (
                                    <span className="selection-duration">
                                        ({selectedDates.duration} hari)
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                    <button
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