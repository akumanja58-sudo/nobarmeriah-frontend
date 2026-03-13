'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react';

export default function MMAFightList({ fights = [], grouped = [], upcomingFights = [], onFightClick, selectedFight }) {
    const router = useRouter();
    const [collapsedCats, setCollapsedCats] = useState({});

    const toggle = (id) => setCollapsedCats(p => ({ ...p, [id]: !p[id] }));
    const handleClick = (fight) => { onFightClick?.(fight); router.push(`/mma/fight/${fight.id}`); };

    const fmtTime = (d, t) => { if (t) return t.substring(0, 5); if (!d) return '-'; return new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }); };
    const fmtDate = (d) => { if (!d) return ''; return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }); };

    // Group upcoming fights by category
    const groupUpcoming = (fights) => {
        const g = {};
        fights.forEach(f => {
            const catId = f.category?.id || 'unknown';
            if (!g[catId]) g[catId] = { category_id: catId, category_name: f.category?.name || 'MMA', category_logo: f.category?.logo, fights: [] };
            g[catId].fights.push(f);
        });
        return Object.values(g);
    };

    if (grouped.length === 0 && upcomingFights.length === 0) return (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center"><span className="text-3xl block mb-2">🥊</span><p className="text-gray-500 font-condensed">Tidak ada fight hari ini</p></div>
    );

    const upcomingGrouped = groupUpcoming(upcomingFights);

    return (
        <div className="space-y-2">
            {/* Today's fights */}
            {grouped.map(cat => {
                const collapsed = collapsedCats[cat.category_id];
                return (
                    <div key={cat.category_id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <button onClick={() => toggle(cat.category_id)} className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 transition-colors">
                            <div className="flex items-center gap-2">
                                {cat.category_logo ? <img src={cat.category_logo} alt="" className="w-5 h-5 object-contain" /> : <span className="text-sm">🥊</span>}
                                <div className="text-left">
                                    <p className="text-white font-bold font-condensed text-sm">{cat.category_name}</p>
                                    <p className="text-gray-400 text-[10px] font-condensed">{cat.country && `${cat.country} • `}{cat.fights.length} fight{cat.fights.length > 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {cat.fights.some(f => f.isLive) && <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold"><span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>LIVE</span>}
                                {collapsed ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
                            </div>
                        </button>
                        {!collapsed && (
                            <div className="divide-y divide-gray-100">
                                {cat.fights.map(fight => {
                                    const sel = selectedFight?.id === fight.id;
                                    return (
                                        <div key={fight.id} onClick={() => handleClick(fight)} className={`px-4 py-3 cursor-pointer transition-colors ${sel ? 'bg-gray-50 border-l-4 border-l-gray-800' : 'hover:bg-gray-50'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-14 flex-shrink-0 text-center">
                                                    {fight.isLive ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded"><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>LIVE</span>
                                                        : fight.isFinished ? <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">FT</span>
                                                            : <p className="text-xs font-bold text-gray-600 font-condensed">{fmtTime(fight.date, fight.time)}</p>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        {fight.fighter1?.logo ? <img src={fight.fighter1.logo} alt="" className="w-5 h-5 rounded-full object-cover" /> : <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center"><span className="text-[8px] font-bold text-gray-500">{fight.fighter1?.name?.[0]}</span></div>}
                                                        <span className={`text-sm font-condensed truncate ${fight.isFinished && fight.fighter1?.winner ? 'text-green-600 font-bold' : 'text-gray-800'}`}>{fight.fighter1?.name || 'TBA'}</span>
                                                        {fight.isFinished && fight.fighter1?.winner && <Trophy className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {fight.fighter2?.logo ? <img src={fight.fighter2.logo} alt="" className="w-5 h-5 rounded-full object-cover" /> : <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center"><span className="text-[8px] font-bold text-gray-500">{fight.fighter2?.name?.[0]}</span></div>}
                                                        <span className={`text-sm font-condensed truncate ${fight.isFinished && fight.fighter2?.winner ? 'text-green-600 font-bold' : 'text-gray-800'}`}>{fight.fighter2?.name || 'TBA'}</span>
                                                        {fight.isFinished && fight.fighter2?.winner && <Trophy className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
                                                    </div>
                                                    {fight.isFinished && fight.result?.method && <p className="text-[10px] text-gray-400 font-condensed mt-1">{fight.result.method}{fight.result.round ? ` • R${fight.result.round}` : ''}</p>}
                                                </div>
                                                {fight.weightClass && <span className="text-[9px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-condensed flex-shrink-0">{fight.weightClass}</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Upcoming fights */}
            {upcomingFights.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-700 to-gray-600 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">📅</span>
                            <h3 className="text-white font-bold font-condensed text-sm">Fight Mendatang</h3>
                            <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full ml-auto">{upcomingFights.length} fight{upcomingFights.length > 1 ? 's' : ''}</span>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {upcomingFights.slice(0, 15).map(fight => (
                            <div key={fight.id} onClick={() => handleClick(fight)} className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 flex-shrink-0 text-center">
                                        <p className="text-[10px] font-bold text-gray-500 font-condensed">{fmtDate(fight.date)}</p>
                                        <p className="text-[10px] text-gray-400 font-condensed">{fmtTime(fight.date, fight.time)}</p>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0"><span className="text-[8px] font-bold text-gray-500">{fight.fighter1?.name?.[0]}</span></div>
                                            <span className="text-sm font-condensed text-gray-800 truncate">{fight.fighter1?.name || 'TBA'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0"><span className="text-[8px] font-bold text-gray-500">{fight.fighter2?.name?.[0]}</span></div>
                                            <span className="text-sm font-condensed text-gray-800 truncate">{fight.fighter2?.name || 'TBA'}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-condensed mt-1">{fight.category?.name}{fight.weightClass ? ` • ${fight.weightClass}` : ''}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
