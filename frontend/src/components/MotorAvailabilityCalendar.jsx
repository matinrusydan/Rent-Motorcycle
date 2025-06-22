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
    const [selectionMode, setSelectionMode] = useState('start'); // 'start', 'end', 'complete'

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
                        start_date: startOfMonth.toISOString().split('T')[0],
                        end_date: endOfMonth.toISOString().split('T')[0]
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

    const isDateReserved = (date) => {
        if (!date) return false;
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        return reservations.some(reservation => {
            const start = new Date(reservation.tanggal_mulai);
            const end = new Date(reservation.tanggal_selesai);
            start.setHours(0,0,0,0);
            end.setHours(0,0,0,0);
            
            return targetDate >= start && targetDate <= end;
        });
    };

    const isDateInPast = (date) => {
        if (!date) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

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

    const checkDateRangeAvailability = (startDate, endDate) => {
        const datesInRange = getDatesInRange(startDate, endDate);
        for (let date of datesInRange) {
            if (isDateReserved(date) || isDateInPast(date)) {
                return { available: false, conflictDate: date };
            }
        }
        return { available: true, conflictDate: null };
    };

    // FIXED: Improved date selection logic
    const handleDateClick = (date) => {
        if (!date || isDateInPast(date) || isDateReserved(date) || loading) {
            return;
        }

        const clickedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        // If no start date selected, or if we're starting fresh
        if (selectionMode === 'start' || !selectedDates.startDate) {
            const newSelection = { 
                startDate: clickedDate, 
                endDate: clickedDate, 
                duration: 1 
            };
            setSelectedDates(newSelection);
            setSelectionMode('end');

            // Notify parent component
            if (onDateSelect) {
                onDateSelect({
                    startDate: clickedDate.toISOString().split('T')[0],
                    endDate: clickedDate.toISOString().split('T')[0],
                    duration: 1
                });
            }
            return;
        }

        // If we're selecting end date
        if (selectionMode === 'end' && selectedDates.startDate) {
            let startDate = selectedDates.startDate;
            let endDate = clickedDate;

            // Ensure start date is before end date
            if (endDate < startDate) {
                [startDate, endDate] = [endDate, startDate];
            }

            // Check if the range is available
            const availability = checkDateRangeAvailability(startDate, endDate);
            
            if (!availability.available) {
                alert(`Tidak dapat memilih rentang tanggal karena ada konflik pada ${formatDate(availability.conflictDate)}. Silakan pilih tanggal lain.`);
                return;
            }

            const duration = getDatesInRange(startDate, endDate).length;
            const newSelection = { 
                startDate, 
                endDate, 
                duration 
            };
            
            setSelectedDates(newSelection);
            setSelectionMode('complete');

            // Notify parent component
            if (onDateSelect) {
                onDateSelect({
                    startDate: startDate.toISOString().split('T')[0],
                    endDate: endDate.toISOString().split('T')[0],
                    duration
                });
            }
            return;
        }

        // If selection is complete, start new selection
        if (selectionMode === 'complete') {
            const newSelection = { 
                startDate: clickedDate, 
                endDate: clickedDate, 
                duration: 1 
            };
            setSelectedDates(newSelection);
            setSelectionMode('end');

            // Notify parent component
            if (onDateSelect) {
                onDateSelect({
                    startDate: clickedDate.toISOString().split('T')[0],
                    endDate: clickedDate.toISOString().split('T')[0],
                    duration: 1
                });
            }
        }
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        const today = new Date();
        today.setHours(0,0,0,0);
        const firstDayOfCurrentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const prevMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        
        if (prevMonthDate >= new Date(today.getFullYear(), today.getMonth(), 1)) {
            setCurrentMonth(prevMonthDate);
        }
    };

    const clearSelection = () => {
        setSelectedDates({ startDate: null, endDate: null, duration: 0 });
        setSelectionMode('start');
        if (onDateSelect) {
            onDateSelect(null);
        }
    };

    const days = getDaysInMonth(currentMonth);

    return (
        <div className="motor-calendar-container">
            <div className="calendar-header">
                <button 
                    onClick={prevMonth} 
                    className="calendar-nav-btn" 
                    disabled={loading}
                >
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

            <div className="calendar-instructions">
                {selectionMode === 'start' && (
                    <p className="selection-hint">Klik tanggal untuk memulai pemilihan</p>
                )}
                {selectionMode === 'end' && (
                    <p className="selection-hint">Klik tanggal lain untuk menentukan tanggal akhir, atau klik tanggal yang sama untuk 1 hari saja</p>
                )}
                {selectionMode === 'complete' && (
                    <p className="selection-hint">Klik tanggal lain untuk memulai pemilihan baru</p>
                )}
            </div>

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

                    const dayClass = `
                        calendar-day
                        ${isSelected ? 'calendar-day-selected' : ''}
                        ${isReserved ? 'calendar-day-reserved' : ''}
                        ${isPast ? 'calendar-day-past' : ''}
                        ${isClickable ? 'calendar-day-clickable' : ''}
                    `.trim();

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
                        <span className="selection-label">Periode Dipilih:</span>
                        <span className="selection-value">
                            {formatDate(selectedDates.startDate)}
                        </span>
                        {selectedDates.endDate && selectedDates.startDate.toDateString() !== selectedDates.endDate.toDateString() && (
                            <>
                                <span className="selection-label">hingga</span>
                                <span className="selection-value">
                                    {formatDate(selectedDates.endDate)}
                                </span>
                            </>
                        )}
                        <span className="selection-duration">
                            ({selectedDates.duration} hari)
                        </span>
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