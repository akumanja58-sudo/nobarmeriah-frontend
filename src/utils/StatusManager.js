// src/utils/StatusManager.js
class StatusManager {
    /**
     * Format waktu ke WIB (UTC+7)
     */
    static formatToWIB(dateString) {
        if (!dateString) return null;

        try {
            const date = new Date(dateString);

            // Format ke WIB (UTC+7)
            const options = {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'Asia/Jakarta'
            };

            return date.toLocaleTimeString('id-ID', options) + ' WIB';
        } catch (e) {
            console.error('Error formatting date:', e);
            return null;
        }
    }

    /**
     * Format waktu singkat (tanpa WIB) untuk display compact
     */
    static formatTimeShort(dateString) {
        if (!dateString) return null;

        try {
            const date = new Date(dateString);

            const options = {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'Asia/Jakarta'
            };

            return date.toLocaleTimeString('id-ID', options);
        } catch (e) {
            return null;
        }
    }

    static getDisplayInfo(match) {
        // Prioritas 1: Gunakan enhanced status dari backend kalau ada
        if (match.display_text && match.status_color) {
            return {
                text: match.display_text,
                subText: match.contextual_info || '',
                color: this.mapBackendColor(match.status_color),
                icon: match.status_icon || '',
                isCritical: match.is_critical_moment || false,
                isLive: match.is_live || false
            };
        }

        // Prioritas 2: Fallback manual
        return this.processManually(match);
    }

    static processManually(match) {
        const status = match.status_short || match.status || 'NS';
        const elapsed = match.minute || match.elapsed || 0;

        // Deteksi scheduled match
        const scheduledStatuses = ['NS', 'TBD', 'scheduled'];
        const isScheduled = (
            scheduledStatuses.includes(status) ||
            status.toLowerCase().includes('belum dimulai') ||
            status.toLowerCase().includes('scheduled') ||
            status.toLowerCase().includes('not started')
        );

        // Mapping status
        const statusMap = {
            'NS': { text: '', color: 'text-blue-600', timeShow: true },
            'TBD': { text: '', color: 'text-blue-600', timeShow: true },
            'scheduled': { text: '', color: 'text-blue-600', timeShow: true },
            '1H': { text: 'Babak Pertama', color: 'text-red-600', timeShow: false },
            'HT': { text: 'HT', color: 'text-orange-600', timeShow: false },
            '2H': { text: 'Babak Kedua', color: 'text-red-600', timeShow: false },
            'FT': { text: 'FT', color: 'text-green-600', timeShow: false },
            'AET': { text: 'AET', color: 'text-green-600', timeShow: false },
            'PEN': { text: 'PEN', color: 'text-purple-600', timeShow: false },
            'ET': { text: 'Extra Time', color: 'text-purple-600', timeShow: false },
            'BT': { text: 'Break', color: 'text-orange-600', timeShow: false },
            'P': { text: 'Penalties', color: 'text-purple-600', timeShow: false },
            'SUSP': { text: 'Suspended', color: 'text-gray-600', timeShow: false },
            'INT': { text: 'Interrupted', color: 'text-gray-600', timeShow: false },
            'PST': { text: 'Postponed', color: 'text-gray-600', timeShow: false },
            'CANC': { text: 'Cancelled', color: 'text-gray-600', timeShow: false },
            'ABD': { text: 'Abandoned', color: 'text-gray-600', timeShow: false },
            'AWD': { text: 'Awarded', color: 'text-gray-600', timeShow: false },
            'WO': { text: 'Walkover', color: 'text-gray-600', timeShow: false },
            'LIVE': { text: 'LIVE', color: 'text-red-600', timeShow: false },
            'live': { text: 'LIVE', color: 'text-red-600', timeShow: false },
            'finished': { text: 'FT', color: 'text-green-600', timeShow: false }
        };

        const base = statusMap[status] || {
            text: '',
            color: 'text-blue-600',
            timeShow: isScheduled
        };

        let subText = '';
        let isCritical = false;
        let displayText = base.text;

        // ✅ HANDLE SCHEDULED MATCH - Tampilkan jam kick-off
        if (isScheduled) {
            // Coba ambil waktu dari berbagai field
            let kickoffTime = match.kickoff_wib || match.kickoff || match.local_time;

            // Kalau gak ada, parse dari field date
            if (!kickoffTime && match.date) {
                kickoffTime = this.formatTimeShort(match.date);
            }

            if (kickoffTime && kickoffTime !== 'TBD') {
                displayText = kickoffTime;
                subText = 'WIB';
            } else {
                displayText = 'TBD';
                subText = '';
            }

            return {
                text: displayText,
                subText,
                color: 'text-blue-600',
                isCritical: false,
                isLive: false
            };
        }

        // Handle LIVE dengan menit
        if (status === '1H' || status === 'LIVE' || status === 'live') {
            if (elapsed > 0) {
                if (elapsed <= 45) {
                    subText = `${elapsed}'`;
                } else {
                    const injury = Math.min(elapsed - 45, 10);
                    subText = `45+${injury}'`;
                    isCritical = true;
                }
            }
        } else if (status === '2H') {
            if (elapsed > 0) {
                if (elapsed <= 90) {
                    subText = `${elapsed}'`;
                    isCritical = elapsed >= 89;
                } else {
                    const injury = Math.min(elapsed - 90, 10);
                    subText = `90+${injury}'`;
                    isCritical = true;
                }
            }
        }

        // Handle penalty display
        if (status === 'PEN' || status === 'P') {
            if (match.pen_home !== undefined || match.pen_away !== undefined) {
                subText = `(${match.pen_home || 0}-${match.pen_away || 0})`;
            } else if (match.pen_home_goals !== undefined || match.pen_away_goals !== undefined) {
                subText = `(${match.pen_home_goals || 0}-${match.pen_away_goals || 0})`;
            }
        }

        return {
            text: displayText || status,
            subText,
            color: base.color,
            isCritical,
            isLive: ['1H', '2H', 'LIVE', 'live', 'ET', 'BT', 'P'].includes(status) || match.is_live
        };
    }

    static mapBackendColor(backendColor) {
        const colorMap = {
            'red': 'text-red-600',
            'orange': 'text-orange-600',
            'green': 'text-green-600',
            'blue': 'text-blue-600',
            'purple': 'text-purple-600',
            'yellow': 'text-yellow-600',
            'gray': 'text-gray-600'
        };
        return colorMap[backendColor] || 'text-gray-600';
    }
}

export default StatusManager;
