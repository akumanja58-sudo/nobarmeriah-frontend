'use client';

import { Trophy, Clock } from 'lucide-react';

export default function MMAPreview({ fights = [], upcomingFights = [], fight, user, onFightClick }) {
    const allFights = [...fights, ...upcomingFights];
    const nextFight = fight || allFights.find(f => !f.isFinished) || allFights[0];
    const fmtDate = (d) => { if (!d) return '-'; return new Date(d).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); };
    const fmtTime = (d, t) => { if (t) return t.substring(0, 5); if (!d) return '-'; return new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }); };

    if (!nextFight) return <div className="bg-white rounded-xl shadow-sm p-8 text-center"><span className="text-3xl block mb-2">🥊</span><p className="text-gray-500 font-condensed">Tidak ada fight</p></div>;

    const isLive = nextFight.isLive, isFinished = nextFight.isFinished;

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <span className="text-white font-bold font-condensed text-sm">{isLive ? '🔴 Fight Berlangsung' : isFinished ? 'Hasil Fight' : 'Fight Berikutnya'}</span>
                        {nextFight.category?.name && <span className="text-gray-300 text-xs font-condensed">{nextFight.category.name}</span>}
                    </div>
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 text-center">
                            <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                                {nextFight.fighter1?.logo ? <img src={nextFight.fighter1.logo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span className="text-2xl font-bold text-gray-400">{nextFight.fighter1?.name?.[0] || '?'}</span></div>}
                            </div>
                            <p className={`font-bold font-condensed text-sm ${isFinished && nextFight.fighter1?.winner ? 'text-green-600' : 'text-gray-800'}`}>{nextFight.fighter1?.name || 'TBA'}</p>
                            {isFinished && nextFight.fighter1?.winner && <div className="flex items-center justify-center gap-1 mt-1"><Trophy className="w-3 h-3 text-yellow-500" /><span className="text-[10px] text-yellow-600 font-condensed font-bold">WINNER</span></div>}
                        </div>
                        <div className="flex-shrink-0">
                            {isLive ? <div className="bg-red-600 text-white px-3 py-2 rounded-lg"><p className="text-xs font-bold font-condensed">LIVE</p></div>
                                : isFinished ? <div className="bg-gray-100 text-gray-500 px-3 py-2 rounded-lg"><p className="text-xs font-bold font-condensed">RESULT</p></div>
                                    : <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg"><p className="text-lg font-black font-condensed">VS</p></div>}
                        </div>
                        <div className="flex-1 text-center">
                            <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                                {nextFight.fighter2?.logo ? <img src={nextFight.fighter2.logo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span className="text-2xl font-bold text-gray-400">{nextFight.fighter2?.name?.[0] || '?'}</span></div>}
                            </div>
                            <p className={`font-bold font-condensed text-sm ${isFinished && nextFight.fighter2?.winner ? 'text-green-600' : 'text-gray-800'}`}>{nextFight.fighter2?.name || 'TBA'}</p>
                            {isFinished && nextFight.fighter2?.winner && <div className="flex items-center justify-center gap-1 mt-1"><Trophy className="w-3 h-3 text-yellow-500" /><span className="text-[10px] text-yellow-600 font-condensed font-bold">WINNER</span></div>}
                        </div>
                    </div>
                    {isFinished && nextFight.result?.method && <div className="mt-4 text-center bg-gray-50 rounded-lg p-3"><p className="text-gray-800 font-bold font-condensed text-sm">{nextFight.result.method}</p><p className="text-gray-500 text-xs font-condensed">{nextFight.result.round ? `Round ${nextFight.result.round}` : ''}{nextFight.result.time ? ` • ${nextFight.result.time}` : ''}</p></div>}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="bg-gray-50 rounded-lg p-2.5 text-center"><p className="text-[10px] text-gray-400 font-condensed">Tanggal</p><p className="text-xs text-gray-700 font-condensed font-semibold">{fmtDate(nextFight.date)}</p></div>
                        <div className="bg-gray-50 rounded-lg p-2.5 text-center"><p className="text-[10px] text-gray-400 font-condensed">Waktu</p><p className="text-xs text-gray-700 font-condensed font-semibold">{fmtTime(nextFight.date, nextFight.time)}</p></div>
                    </div>
                    {nextFight.weightClass && <div className="mt-2 text-center"><span className="inline-block text-[10px] text-gray-500 bg-gray-50 px-3 py-1 rounded-full font-condensed">{nextFight.weightClass}</span></div>}
                    <button onClick={() => onFightClick?.(nextFight)} className="w-full mt-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-bold font-condensed rounded-lg transition-colors text-sm">Lihat Detail Fight</button>
                </div>
            </div>
            {allFights.filter(f => !f.isFinished && f.id !== nextFight?.id).length > 0 && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100"><h3 className="text-gray-800 font-bold font-condensed text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" />Fight Mendatang</h3></div>
                    <div className="divide-y divide-gray-100">
                        {allFights.filter(f => !f.isFinished && f.id !== nextFight?.id).slice(0, 5).map(f => (
                            <div key={f.id} onClick={() => onFightClick?.(f)} className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                                <p className="text-xs text-gray-700 font-condensed truncate">{f.fighter1?.name || 'TBA'} vs {f.fighter2?.name || 'TBA'}</p>
                                <p className="text-[10px] text-gray-400 font-condensed">{f.category?.name} • {fmtDate(f.date)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
