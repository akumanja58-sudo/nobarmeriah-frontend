import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, X, Zap } from 'lucide-react';
import DatePreview from './DatePreview';

const CalendarDatePicker = ({ matches = [], selectedDate, onDateSelect, onClose, liveMatches = [] }) => {
    // State management
    const [currentMonth, setCurrentMonth] = useState(() => {
        const date = new Date(selectedDate || new Date());
        return new Date(date.getFullYear(), date.getMonth(), 1);
    });
    const [isOpen, setIsOpen] = useState(false);
    const [matchCounts, setMatchCounts] = useState({});
    const [hoveredDate, setHoveredDate] = useState(null);
    const [datesWithMatches, setDatesWithMatches] = useState(new Set());
    const [datesWithLiveMatches, setDatesWithLiveMatches] = useState(new Set());

    // Refs
    const calendarRef = useRef(null);

    // Constants
    const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

    // Get today's date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Auto reset to today at midnight
    useEffect(() => {
        // Only reset once per day, not on every selectedDate change
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        const timeUntilMidnight = midnight.getTime() - now.getTime();

        const timer = setTimeout(() => {
            // Only auto-reset if user hasn't manually selected other dates recently
            const lastSelection = localStorage.getItem('lastManualDateSelection');
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

            if (!lastSelection || parseInt(lastSelection) < fiveMinutesAgo) {
                const newToday = new Date().toISOString().split('T')[0];
                onDateSelect(newToday);
                setCurrentMonth(new Date());
            }
        }, timeUntilMidnight);

        return () => clearTimeout(timer);
    }, []);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target)) {
                onClose?.();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Process live matches (new feature)
    useEffect(() => {
        if (!liveMatches || liveMatches.length === 0) {
            setDatesWithLiveMatches(new Set());
            return;
        }

        const liveDates = new Set();

        liveMatches.forEach(match => {
            let dateStr = null;

            if (match.local_date) {
                dateStr = match.local_date;
            } else if (match.kickoff) {
                try {
                    const kickoffDate = new Date(match.kickoff);
                    if (!isNaN(kickoffDate.getTime())) {
                        dateStr = kickoffDate.toISOString().split('T')[0];
                    }
                } catch (error) {
                    console.warn(`Invalid live match kickoff: ${match.kickoff}`);
                }
            }

            if (dateStr) {
                liveDates.add(dateStr);
            }
        });

        setDatesWithLiveMatches(liveDates);
        console.log('📺 Live matches dates:', Array.from(liveDates));
    }, [liveMatches]);

    // Process match dates
    useEffect(() => {
        const processMatches = () => {
            const counts = {};
            const processedDates = new Set();
            let successCount = 0;
            let failCount = 0;

            matches.forEach(match => {
                let dateStr = null;
                let method = '';

                // Try to get the date in order of priority
                if (match.local_date && match.local_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    dateStr = match.local_date;
                    method = 'local_date_direct';
                } else if (match.kickoff) {
                    try {
                        const kickoffDate = new Date(match.kickoff);
                        if (!isNaN(kickoffDate.getTime())) {
                            dateStr = kickoffDate.toISOString().split('T')[0];
                            method = 'kickoff_parsed';
                        }
                    } catch (error) {
                        console.warn(`Invalid kickoff date: ${match.kickoff}`);
                    }
                } else if (match.date) {
                    try {
                        const matchDate = new Date(match.date);
                        if (!isNaN(matchDate.getTime())) {
                            dateStr = matchDate.toISOString().split('T')[0];
                            method = 'date_parsed';
                        }
                    } catch (error) {
                        console.warn(`Invalid match date: ${match.date}`);
                    }
                }

                if (dateStr) {
                    counts[dateStr] = (counts[dateStr] || 0) + 1;
                    processedDates.add(dateStr);
                    successCount++;
                } else {
                    failCount++;
                }
            });

            setMatchCounts(counts);
            setDatesWithMatches(processedDates);

            console.log('📊 Match processing results:', {
                total: matches.length,
                success: successCount,
                failed: failCount,
                uniqueDates: processedDates.size,
                dates: Array.from(processedDates).sort()
            });
        };

        processMatches();
    }, [matches]);

    // Categorize dates with enhanced live support
    const categories = useMemo(() => {
        const result = {
            upcoming: new Set(),
            today: new Set(),
            recent: new Set(),
            history: new Set(),
            live: new Set()
        };

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        datesWithMatches.forEach(dateStr => {
            const date = new Date(dateStr);
            date.setHours(0, 0, 0, 0);

            const diffDays = Math.floor((date - now) / (1000 * 60 * 60 * 24));
            const hasLiveMatches = datesWithLiveMatches.has(dateStr);

            // Priority: live matches override normal categorization
            if (hasLiveMatches) {
                result.live.add(dateStr);
            } else if (diffDays > 0) {
                result.upcoming.add(dateStr);
            } else if (diffDays === 0) {
                result.today.add(dateStr);
            } else if (diffDays > -3) {
                result.recent.add(dateStr);
            } else {
                result.history.add(dateStr);
            }
        });

        return result;
    }, [datesWithMatches, datesWithLiveMatches]);

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        // Calculate days in month and first day of week
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasMatches = datesWithMatches.has(dateStr);
            const hasLiveMatches = datesWithLiveMatches.has(dateStr);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;

            let status = 'none';
            if (categories.live.has(dateStr)) status = 'live';
            else if (categories.upcoming.has(dateStr)) status = 'upcoming';
            else if (categories.today.has(dateStr)) status = 'today';
            else if (categories.recent.has(dateStr)) status = 'recent';
            else if (categories.history.has(dateStr)) status = 'history';

            days.push({
                day,
                dateStr,
                hasMatches,
                hasLiveMatches,
                isToday,
                isSelected,
                status
            });
        }

        return days;
    }, [currentMonth, datesWithMatches, datesWithLiveMatches, selectedDate, todayStr, categories]);

    // Handlers
    const handleDateClick = (dateStr) => {
        localStorage.setItem('lastManualDateSelection', Date.now().toString());
        onDateSelect(dateStr);
        setIsOpen(false);
    };

    const handleTodayClick = () => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
        onDateSelect(todayStr);
        setIsOpen(false);
    };

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return "Pilih Tanggal";

        try {
            const date = new Date(dateStr);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const todayStr = today.toISOString().split('T')[0];
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            const tomorrowStr = tomorrow.toISOString().split('T')[0];

            if (dateStr === todayStr) {
                return "Hari Ini";
            } else if (dateStr === yesterdayStr) {
                return "Kemarin";
            } else if (dateStr === tomorrowStr) {
                return "Besok";
            } else {
                return date.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short'
                });
            }
        } catch (error) {
            console.warn(`Error formatting date: ${dateStr}`);
            return "Pilih Tanggal";
        }
    };

    return (
        <div className="relative" ref={calendarRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
            >
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                    {formatDisplayDate(selectedDate)}
                </span>
                {datesWithLiveMatches.has(selectedDate) && (
                    <Zap className="w-3 h-3 text-red-500" />
                )}
                <ChevronRight
                    className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className="fixed inset-x-4 top-1/2 transform -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 max-w-sm mx-auto">
                        <div className="flex justify-end p-2">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="flex items-center justify-between px-4 pb-4">
                            <button
                                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-600" />
                            </button>

                            <h3 className="text-lg font-semibold text-gray-800">
                                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                            </h3>

                            <button
                                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <ChevronRight className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        <div className="px-4 pb-4">
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {dayNames.map(day => (
                                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {calendarDays.map((day, index) => {
                                    if (!day) {
                                        return <div key={`empty-${index}`} className="aspect-square" />;
                                    }

                                    return (
                                        <button
                                            key={day.dateStr}
                                            onClick={() => handleDateClick(day.dateStr)}
                                            onMouseEnter={() => day.hasMatches && setHoveredDate(day.dateStr)}
                                            onMouseLeave={() => setHoveredDate(null)}
                                            className={`
                                                aspect-square flex items-center justify-center text-sm font-medium 
                                                rounded-lg transition-all relative
                                                ${day.isSelected
                                                    ? 'bg-blue-500 text-white shadow-md'
                                                    : day.isToday
                                                        ? 'bg-blue-100 text-blue-600'
                                                        : day.hasLiveMatches
                                                            ? 'bg-red-50 text-red-600 border border-red-200'
                                                            : 'hover:bg-gray-100 text-gray-700'
                                                }
                                            `}
                                        >
                                            {day.day}
                                            {day.hasLiveMatches && (
                                                <Zap className={`
                                                    absolute top-0.5 right-0.5 w-2.5 h-2.5
                                                    ${day.isSelected ? 'text-white' : 'text-red-500'}
                                                `} />
                                            )}
                                            {day.hasMatches && (
                                                <div className={`
                                                    absolute bottom-1 left-1/2 transform -translate-x-1/2
                                                    w-1.5 h-1.5 rounded-full
                                                    ${day.isSelected ? 'bg-white' :
                                                        day.status === 'live' ? 'bg-red-500' :
                                                            day.status === 'today' ? 'bg-green-400' :
                                                                day.status === 'upcoming' ? 'bg-green-500' :
                                                                    day.status === 'recent' ? 'bg-orange-400' :
                                                                        'bg-gray-400'
                                                    }
                                                `} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                                        <span className="text-xs text-gray-500">Pertandingan</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <Zap className="w-2.5 h-2.5 text-red-500" />
                                        <span className="text-xs text-gray-500">Live</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleTodayClick}
                                    className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md"
                                >
                                    HARI INI
                                </button>
                            </div>

                            {datesWithLiveMatches.size > 0 && (
                                <div className="text-xs text-red-600 font-medium">
                                    🔴 {datesWithLiveMatches.size} hari dengan pertandingan live
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CalendarDatePicker;