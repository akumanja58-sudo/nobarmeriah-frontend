import React from 'react';

const DatePreview = ({ matches, date }) => {
    if (!matches || matches.length === 0) return null;

    const formattedDate = new Date(date).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="bg-slate-800 text-white p-3 rounded-lg shadow-xl w-64">
            <div className="text-sm font-medium mb-2 text-gray-300">
                {formattedDate}
            </div>
            <div className="space-y-2">
                {matches.map((match, idx) => (
                    <div key={idx} className="text-sm">
                        <span className="text-gray-300">{match.time}</span>
                        <div className="flex items-center justify-between gap-2">
                            <span className="truncate flex-1">{match.home}</span>
                            <span className="text-gray-400">vs</span>
                            <span className="truncate flex-1 text-right">{match.away}</span>
                        </div>
                    </div>
                ))}
                {matches.length === 3 && (
                    <div className="text-xs text-gray-400 text-center mt-1">
                        Dan pertandingan lainnya...
                    </div>
                )}
            </div>
        </div>
    );
};

export default DatePreview;
