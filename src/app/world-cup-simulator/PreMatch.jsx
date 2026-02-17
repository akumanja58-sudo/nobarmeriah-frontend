'use client';

import { useState } from 'react';
import { X, ChevronRight } from 'lucide-react';

const flagUrl = (code) => `https://flagcdn.com/w40/${code}.png`;
const flagUrlLg = (code) => `https://flagcdn.com/w80/${code}.png`;
const Flag = ({ code, size = 20 }) => (
  <img src={flagUrl(code)} alt="" className="inline-block object-cover rounded-sm" style={{ width: size, height: Math.round(size * 0.75) }} />
);
const FlagLg = ({ code, size = 48 }) => (
  <img src={flagUrlLg(code)} alt="" className="inline-block object-cover rounded" style={{ width: size, height: Math.round(size * 0.75) }} />
);

const FORMATIONS = [
  { id: '4-3-3', label: '4-3-3', positions: { GK: 1, DEF: 4, MID: 3, FWD: 3 } },
  { id: '4-4-2', label: '4-4-2', positions: { GK: 1, DEF: 4, MID: 4, FWD: 2 } },
  { id: '4-2-3-1', label: '4-2-3-1', positions: { GK: 1, DEF: 4, MID: 5, FWD: 1 } },
  { id: '3-5-2', label: '3-5-2', positions: { GK: 1, DEF: 3, MID: 5, FWD: 2 } },
  { id: '4-1-4-1', label: '4-1-4-1', positions: { GK: 1, DEF: 4, MID: 5, FWD: 1 } },
  { id: '5-3-2', label: '5-3-2', positions: { GK: 1, DEF: 5, MID: 3, FWD: 2 } },
];

const TACTICS = [
  { id: 'attacking', label: 'Menyerang', icon: '⚔️', desc: 'Tekanan tinggi, banyak peluang, rawan counter', color: 'red' },
  { id: 'balanced', label: 'Seimbang', icon: '⚖️', desc: 'Keseimbangan serangan & pertahanan', color: 'blue' },
  { id: 'defensive', label: 'Bertahan', icon: '🛡️', desc: 'Solid di belakang, mengandalkan counter-attack', color: 'green' },
];

const POS_COLORS = {
  GK: { bg: 'bg-yellow-400', text: 'text-yellow-900' },
  DEF: { bg: 'bg-blue-500', text: 'text-white' },
  MID: { bg: 'bg-green-500', text: 'text-white' },
  FWD: { bg: 'bg-red-500', text: 'text-white' },
};
const POS_BADGE = { GK: 'bg-yellow-100 text-yellow-700', DEF: 'bg-blue-100 text-blue-700', MID: 'bg-green-100 text-green-700', FWD: 'bg-red-100 text-red-700' };

const FIELD_POSITIONS = {
  '4-3-3': [
    { pos: 'GK', x: 50, y: 90 },
    { pos: 'DEF', x: 15, y: 72 }, { pos: 'DEF', x: 38, y: 75 }, { pos: 'DEF', x: 62, y: 75 }, { pos: 'DEF', x: 85, y: 72 },
    { pos: 'MID', x: 25, y: 52 }, { pos: 'MID', x: 50, y: 55 }, { pos: 'MID', x: 75, y: 52 },
    { pos: 'FWD', x: 20, y: 30 }, { pos: 'FWD', x: 50, y: 25 }, { pos: 'FWD', x: 80, y: 30 },
  ],
  '4-4-2': [
    { pos: 'GK', x: 50, y: 90 },
    { pos: 'DEF', x: 15, y: 72 }, { pos: 'DEF', x: 38, y: 75 }, { pos: 'DEF', x: 62, y: 75 }, { pos: 'DEF', x: 85, y: 72 },
    { pos: 'MID', x: 15, y: 50 }, { pos: 'MID', x: 38, y: 53 }, { pos: 'MID', x: 62, y: 53 }, { pos: 'MID', x: 85, y: 50 },
    { pos: 'FWD', x: 35, y: 28 }, { pos: 'FWD', x: 65, y: 28 },
  ],
  '4-2-3-1': [
    { pos: 'GK', x: 50, y: 90 },
    { pos: 'DEF', x: 15, y: 72 }, { pos: 'DEF', x: 38, y: 75 }, { pos: 'DEF', x: 62, y: 75 }, { pos: 'DEF', x: 85, y: 72 },
    { pos: 'MID', x: 35, y: 58 }, { pos: 'MID', x: 65, y: 58 },
    { pos: 'MID', x: 20, y: 42 }, { pos: 'MID', x: 50, y: 40 }, { pos: 'MID', x: 80, y: 42 },
    { pos: 'FWD', x: 50, y: 24 },
  ],
  '3-5-2': [
    { pos: 'GK', x: 50, y: 90 },
    { pos: 'DEF', x: 25, y: 73 }, { pos: 'DEF', x: 50, y: 76 }, { pos: 'DEF', x: 75, y: 73 },
    { pos: 'MID', x: 10, y: 52 }, { pos: 'MID', x: 30, y: 55 }, { pos: 'MID', x: 50, y: 50 }, { pos: 'MID', x: 70, y: 55 }, { pos: 'MID', x: 90, y: 52 },
    { pos: 'FWD', x: 35, y: 28 }, { pos: 'FWD', x: 65, y: 28 },
  ],
  '4-1-4-1': [
    { pos: 'GK', x: 50, y: 90 },
    { pos: 'DEF', x: 15, y: 72 }, { pos: 'DEF', x: 38, y: 75 }, { pos: 'DEF', x: 62, y: 75 }, { pos: 'DEF', x: 85, y: 72 },
    { pos: 'MID', x: 50, y: 60 },
    { pos: 'MID', x: 15, y: 44 }, { pos: 'MID', x: 38, y: 42 }, { pos: 'MID', x: 62, y: 42 }, { pos: 'MID', x: 85, y: 44 },
    { pos: 'FWD', x: 50, y: 24 },
  ],
  '5-3-2': [
    { pos: 'GK', x: 50, y: 90 },
    { pos: 'DEF', x: 10, y: 70 }, { pos: 'DEF', x: 28, y: 75 }, { pos: 'DEF', x: 50, y: 77 }, { pos: 'DEF', x: 72, y: 75 }, { pos: 'DEF', x: 90, y: 70 },
    { pos: 'MID', x: 25, y: 50 }, { pos: 'MID', x: 50, y: 48 }, { pos: 'MID', x: 75, y: 50 },
    { pos: 'FWD', x: 35, y: 28 }, { pos: 'FWD', x: 65, y: 28 },
  ],
};

// ===== FIELD COMPONENT (reused across steps) =====
function FieldPreview({ fieldPositions, startingXI, captain, size = 'normal' }) {
  const isSmall = size === 'small';
  const ballSize = isSmall ? 'w-7 h-7 text-[9px]' : 'w-9 h-9 lg:w-10 lg:h-10 text-[10px] lg:text-xs';
  const nameSize = isSmall ? 'text-[7px] max-w-[50px]' : 'text-[8px] lg:text-[10px] max-w-[60px] lg:max-w-[80px]';
  const capSize = isSmall ? 'w-3 h-3 text-[6px] -top-0.5 -right-0.5' : 'w-4 h-4 text-[8px] -top-1 -right-1';

  return (
    <div className={`relative bg-gradient-to-b from-green-700 via-green-600 to-green-700 rounded-xl lg:rounded-2xl overflow-hidden w-full`}
      style={{ aspectRatio: isSmall ? '3/2.5' : '3/4', maxHeight: isSmall ? undefined : '500px' }}>
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-[5%] right-[5%] h-px bg-white/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-white/30 rounded-full" />
        <div className="absolute top-[5%] left-[20%] right-[20%] h-[18%] border border-white/20 rounded-b-lg" />
        <div className="absolute bottom-[5%] left-[20%] right-[20%] h-[18%] border border-white/20 rounded-t-lg" />
        <div className="absolute top-[5%] left-[35%] right-[35%] h-[8%] border border-white/15" />
        <div className="absolute bottom-[5%] left-[35%] right-[35%] h-[8%] border border-white/15" />
      </div>
      {fieldPositions.map((fp, i) => {
        const player = startingXI[i];
        const isCap = player && captain && player.name === captain.name;
        return (
          <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: `${fp.x}%`, top: `${fp.y}%` }}>
            <div className={`relative ${ballSize} rounded-full flex items-center justify-center font-bold shadow-lg ${POS_COLORS[fp.pos]?.bg} ${POS_COLORS[fp.pos]?.text}`}>
              {i + 1}
              {isCap && <div className={`absolute ${capSize} bg-yellow-400 rounded-full flex items-center justify-center font-bold text-yellow-900 border border-yellow-500`}>C</div>}
            </div>
            <span className={`${nameSize} text-white font-condensed mt-0.5 text-center truncate drop-shadow`}>{player?.name || '?'}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function PreMatchModal({ myTeam, opponent, matchLabel, onClose, onStartMatch }) {
  const [step, setStep] = useState('formation');
  const [formation, setFormation] = useState(FORMATIONS[0]);
  const [tactic, setTactic] = useState(TACTICS[1]);
  const [captain, setCaptain] = useState(null);
  const [startingXI, setStartingXI] = useState([]);
  const [benchSwapFrom, setBenchSwapFrom] = useState(null);

  const autoPickLineup = (f) => {
    const fp = FIELD_POSITIONS[f.id] || FIELD_POSITIONS['4-3-3'];
    const available = [...myTeam.players];
    const picked = [];
    // For each slot in formation, find best available player
    // Priority: exact pos match > nearby pos > anyone
    const nearby = { GK: ['GK'], DEF: ['DEF', 'MID'], MID: ['MID', 'DEF', 'FWD'], FWD: ['FWD', 'MID'] };

    fp.forEach(slot => {
      let best = null;
      // Try exact match first, then fallbacks
      for (const tryPos of (nearby[slot.pos] || [slot.pos])) {
        best = available.find(p => p.pos === tryPos);
        if (best) break;
      }
      if (!best && available.length > 0) best = available[0]; // last resort
      if (best) {
        picked.push(best);
        available.splice(available.indexOf(best), 1);
      }
    });
    return picked.slice(0, 11);
  };

  const handleFormationChange = (f) => {
    setFormation(f);
    const lineup = autoPickLineup(f);
    setStartingXI(lineup);
    if (!captain && lineup.length > 0) {
      const cap = lineup.find(p => p.pos === 'FWD') || lineup.find(p => p.pos === 'MID') || lineup[0];
      setCaptain(cap);
    }
  };

  const [initialized, setInitialized] = useState(false);
  if (!initialized) {
    const lineup = autoPickLineup(FORMATIONS[0]);
    if (lineup.length > 0 && startingXI.length === 0) {
      setStartingXI(lineup);
      const cap = lineup.find(p => p.pos === 'FWD') || lineup.find(p => p.pos === 'MID') || lineup[0];
      setCaptain(cap);
      setInitialized(true);
    }
  }

  const bench = myTeam.players.filter(p => !startingXI.includes(p));
  const swapPlayer = (benchPlayer) => {
    if (benchSwapFrom === null) return;
    setStartingXI(prev => { const next = [...prev]; next[benchSwapFrom] = benchPlayer; return next; });
    setBenchSwapFrom(null);
  };
  const fieldPositions = FIELD_POSITIONS[formation.id] || FIELD_POSITIONS['4-3-3'];
  const isReady = startingXI.length === 11 && captain && tactic;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto">
      <div className="min-h-full bg-gray-50">
        {/* Header */}
        <div className="bg-green-600 text-white px-4 lg:px-6 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={onClose} className="p-1 hover:bg-green-500 rounded-full"><X className="w-5 h-5" /></button>
          <div className="flex-1">
            <p className="text-[10px] lg:text-xs font-condensed text-green-200 uppercase tracking-wider">{matchLabel}</p>
            <div className="flex items-center gap-2">
              <Flag code={myTeam.flagCode} size={20} />
              <span className="font-bold font-condensed text-sm lg:text-base">{myTeam.name}</span>
              <span className="text-green-200 font-condensed text-sm">vs</span>
              <span className="font-bold font-condensed text-sm lg:text-base">{opponent.name}</span>
              <Flag code={opponent.flagCode} size={20} />
            </div>
          </div>
        </div>

        {/* Step Tabs */}
        <div className="bg-white border-b border-gray-200 flex max-w-5xl mx-auto">
          {[{ id: 'formation', label: 'Formasi' }, { id: 'lineup', label: 'Line-up' }, { id: 'tactics', label: 'Taktik' }, { id: 'review', label: 'Review' }].map(s => (
            <button key={s.id} onClick={() => setStep(s.id)}
              className={`flex-1 py-3 text-xs lg:text-sm font-bold font-condensed text-center transition-colors ${step === s.id ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400'}`}>{s.label}</button>
          ))}
        </div>

        <div className="max-w-5xl mx-auto">
          {/* ======== FORMATION ======== */}
          {step === 'formation' && (
            <div className="p-4 lg:p-6 lg:grid lg:grid-cols-2 lg:gap-8">
              {/* PC: field on left */}
              <div className="hidden lg:block">
                <FieldPreview fieldPositions={fieldPositions} startingXI={startingXI} captain={captain} />
              </div>
              {/* Right side (or full on mobile) */}
              <div className="space-y-4">
                <h3 className="text-base lg:text-lg font-bold font-condensed text-gray-900">Pilih Formasi</h3>
                <div className="grid grid-cols-3 gap-2">
                  {FORMATIONS.map(f => (
                    <button key={f.id} onClick={() => handleFormationChange(f)}
                      className={`py-3 lg:py-4 rounded-xl border-2 font-bold font-condensed text-base lg:text-lg transition-all ${formation.id === f.id ? 'border-green-500 bg-green-50 text-green-700 shadow-md' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}>{f.label}</button>
                  ))}
                </div>
                {/* Mobile: field below */}
                <div className="lg:hidden">
                  <FieldPreview fieldPositions={fieldPositions} startingXI={startingXI} captain={captain} />
                </div>
                {/* PC: formation info */}
                <div className="hidden lg:block bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-sm font-bold font-condensed text-gray-700 mb-2">Posisi</p>
                  <div className="flex gap-3">
                    {Object.entries(formation.positions).map(([pos, count]) => (
                      <div key={pos} className="flex items-center gap-1.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${POS_COLORS[pos]?.bg} ${POS_COLORS[pos]?.text}`}>{count}</div>
                        <span className="text-xs font-condensed text-gray-600">{pos}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => setStep('lineup')}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold font-condensed rounded-xl flex items-center justify-center gap-2">
                  Selanjutnya: Line-up <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======== LINEUP ======== */}
          {step === 'lineup' && (
            <div className="p-4 pb-24 lg:p-6 lg:pb-6 lg:max-w-3xl lg:mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base lg:text-lg font-bold font-condensed text-gray-900">Line-up</h3>
                  <p className="text-xs text-gray-500 font-condensed">
                    {benchSwapFrom !== null ? '👇 Pilih pemain cadangan untuk masuk' : 'Tap pemain di lapangan untuk mengganti'}
                  </p>
                </div>
                {benchSwapFrom !== null && (
                  <button onClick={() => setBenchSwapFrom(null)} className="text-xs text-red-500 font-bold font-condensed px-3 py-1 bg-red-50 rounded-lg">Batal</button>
                )}
              </div>

              {/* Interactive Field - compact on mobile */}
              <div className={`relative bg-gradient-to-b from-green-700 via-green-600 to-green-700 rounded-xl lg:rounded-2xl overflow-hidden transition-all aspect-[4/5] lg:aspect-[3/4] ${benchSwapFrom !== null ? 'ring-2 ring-orange-400' : ''}`}
                style={{ maxHeight: '420px' }}>
                <div className="absolute inset-0">
                  <div className="absolute top-1/2 left-[5%] right-[5%] h-px bg-white/30" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-white/30 rounded-full" />
                  <div className="absolute top-[5%] left-[20%] right-[20%] h-[18%] border border-white/20 rounded-b-lg" />
                  <div className="absolute bottom-[5%] left-[20%] right-[20%] h-[18%] border border-white/20 rounded-t-lg" />
                  <div className="absolute top-[5%] left-[35%] right-[35%] h-[8%] border border-white/15" />
                  <div className="absolute bottom-[5%] left-[35%] right-[35%] h-[8%] border border-white/15" />
                </div>
                {/* Starting XI label */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/30 px-3 py-0.5 rounded-full">
                  <span className="text-[9px] lg:text-[10px] text-white/80 font-condensed font-bold uppercase tracking-wider">Starting XI — {formation.label}</span>
                </div>
                {fieldPositions.map((fp, i) => {
                  const player = startingXI[i];
                  const isCap = player && captain && player.name === captain.name;
                  const isSelected = benchSwapFrom === i;
                  return (
                    <button key={i} onClick={() => setBenchSwapFrom(isSelected ? null : i)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
                      style={{ left: `${fp.x}%`, top: `${fp.y}%` }}>
                      <div className={`relative w-9 h-9 lg:w-11 lg:h-11 rounded-full flex items-center justify-center text-[10px] lg:text-xs font-bold shadow-lg transition-all
                        ${POS_COLORS[fp.pos]?.bg} ${POS_COLORS[fp.pos]?.text}
                        ${isSelected ? 'ring-3 ring-orange-400 scale-125 animate-pulse' : 'group-hover:scale-110'}`}>
                        {i + 1}
                        {isCap && <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-[8px] font-bold text-yellow-900 border border-yellow-500">C</div>}
                      </div>
                      <span className={`text-[8px] lg:text-[10px] font-condensed mt-0.5 text-center truncate drop-shadow max-w-[60px] lg:max-w-[80px] ${isSelected ? 'text-orange-300 font-bold' : 'text-white'}`}>
                        {player?.name || '?'}
                      </span>
                      <span className={`text-[7px] font-condensed ${isSelected ? 'text-orange-300' : 'text-white/50'}`}>{player?.pos}</span>
                    </button>
                  );
                })}
              </div>

              {/* Bench Strip */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold font-condensed text-gray-700">
                    {bench.length === 0 ? '🪑 Cadangan' : benchSwapFrom !== null ? '👇 Tap untuk masukkan' : '🪑 Cadangan'}
                  </h4>
                  <span className="text-[10px] font-condensed text-gray-400">{bench.length} pemain</span>
                </div>
                {bench.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-3 text-center">
                    <p className="text-xs font-condensed text-gray-400">Semua pemain sudah di Starting XI</p>
                  </div>
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                    {bench.map((player, i) => (
                      <button key={i} onClick={() => benchSwapFrom !== null ? swapPlayer(player) : null}
                        className={`flex-shrink-0 flex flex-col items-center p-2 lg:p-3 rounded-xl border-2 min-w-[72px] lg:min-w-[80px] transition-all ${benchSwapFrom !== null
                            ? 'border-green-400 bg-green-50 cursor-pointer hover:bg-green-100 hover:scale-105'
                            : 'border-gray-200 bg-white opacity-60'
                          }`}>
                        <div className={`w-8 h-8 lg:w-9 lg:h-9 rounded-full flex items-center justify-center text-[10px] font-bold ${POS_COLORS[player.pos]?.bg} ${POS_COLORS[player.pos]?.text}`}>
                          {player.pos.charAt(0)}
                        </div>
                        <span className="text-[9px] lg:text-[10px] font-semibold font-condensed text-gray-700 mt-1 text-center truncate w-full">{player.name}</span>
                        <span className={`text-[8px] font-bold font-condensed px-1.5 rounded mt-0.5 ${POS_BADGE[player.pos]}`}>{player.pos}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Captain Selection */}
              <div className="bg-white rounded-xl border border-gray-200 p-3 lg:p-4">
                <p className="text-xs font-bold font-condensed text-gray-700 mb-2">🏅 Kapten</p>
                <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                  {startingXI.map((player, i) => {
                    const isCap = captain && player.name === captain.name;
                    return (
                      <button key={i} onClick={() => setCaptain(player)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-condensed font-semibold transition-all ${isCap ? 'bg-yellow-400 text-yellow-900 shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}>
                        {isCap && 'C '}{player.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep('formation')} className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold font-condensed rounded-xl">← Formasi</button>
                <button onClick={() => setStep('tactics')} className="flex-1 py-3 bg-green-600 text-white font-bold font-condensed rounded-xl flex items-center justify-center gap-1">
                  Taktik <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======== TACTICS ======== */}
          {step === 'tactics' && (
            <div className="p-4 lg:p-6 lg:max-w-lg lg:mx-auto space-y-4">
              <h3 className="text-base lg:text-lg font-bold font-condensed text-gray-900">Pilih Taktik</h3>
              <div className="space-y-3">
                {TACTICS.map(t => (
                  <button key={t.id} onClick={() => setTactic(t)}
                    className={`w-full text-left p-4 lg:p-5 rounded-xl border-2 transition-all ${tactic.id === t.id
                        ? t.color === 'red' ? 'border-red-500 bg-red-50' : t.color === 'blue' ? 'border-blue-500 bg-blue-50' : 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl lg:text-3xl">{t.icon}</span>
                      <div>
                        <p className={`text-base lg:text-lg font-bold font-condensed ${tactic.id === t.id ? (t.color === 'red' ? 'text-red-700' : t.color === 'blue' ? 'text-blue-700' : 'text-green-700') : 'text-gray-800'
                          }`}>{t.label}</p>
                        <p className="text-xs lg:text-sm text-gray-500 font-condensed">{t.desc}</p>
                      </div>
                      {tactic.id === t.id && <span className="ml-auto text-green-500 text-lg">✓</span>}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep('lineup')} className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold font-condensed rounded-xl">← Line-up</button>
                <button onClick={() => setStep('review')} className="flex-1 py-3 bg-green-600 text-white font-bold font-condensed rounded-xl flex items-center justify-center gap-1">
                  Review <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======== REVIEW ======== */}
          {step === 'review' && (
            <div className="p-4 lg:p-6 lg:grid lg:grid-cols-2 lg:gap-8">
              {/* Left: Field */}
              <div className="hidden lg:flex lg:flex-col lg:gap-4">
                <FieldPreview fieldPositions={fieldPositions} startingXI={startingXI} captain={captain} />
              </div>
              {/* Right: Info + Kick Off */}
              <div className="space-y-4">
                <h3 className="text-base lg:text-lg font-bold font-condensed text-gray-900">Review & Kick Off</h3>
                {/* VS Card */}
                <div className="bg-white rounded-xl lg:rounded-2xl border border-gray-200 p-4 lg:p-6">
                  <div className="flex items-center justify-center gap-4 lg:gap-8">
                    <div className="text-center">
                      <span className="lg:hidden"><Flag code={myTeam.flagCode} size={36} /></span>
                      <span className="hidden lg:inline-block"><FlagLg code={myTeam.flagCode} size={56} /></span>
                      <p className="text-sm lg:text-base font-bold font-condensed mt-1">{myTeam.name}</p>
                      <p className="text-yellow-500 text-xs lg:text-sm font-condensed">{'★'.repeat(myTeam.stars)}</p>
                    </div>
                    <span className="text-2xl lg:text-3xl font-bold font-condensed text-gray-300">VS</span>
                    <div className="text-center">
                      <span className="lg:hidden"><Flag code={opponent.flagCode} size={36} /></span>
                      <span className="hidden lg:inline-block"><FlagLg code={opponent.flagCode} size={56} /></span>
                      <p className="text-sm lg:text-base font-bold font-condensed mt-1">{opponent.name}</p>
                      <p className="text-yellow-500 text-xs lg:text-sm font-condensed">{'★'.repeat(opponent.stars)}</p>
                    </div>
                  </div>
                </div>
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white rounded-xl border border-gray-200 p-3 lg:p-4 text-center">
                    <p className="text-[10px] lg:text-xs text-gray-400 font-condensed uppercase">Formasi</p>
                    <p className="text-lg lg:text-xl font-bold font-condensed text-gray-900">{formation.label}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-3 lg:p-4 text-center">
                    <p className="text-[10px] lg:text-xs text-gray-400 font-condensed uppercase">Taktik</p>
                    <p className="text-lg lg:text-xl">{tactic.icon}</p>
                    <p className="text-xs lg:text-sm font-bold font-condensed text-gray-700">{tactic.label}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-3 lg:p-4 text-center">
                    <p className="text-[10px] lg:text-xs text-gray-400 font-condensed uppercase">Kapten</p>
                    <p className="text-sm lg:text-base font-bold font-condensed text-gray-900 truncate">{captain?.name || '-'}</p>
                    <p className="text-[10px] lg:text-xs text-gray-400 font-condensed">{captain?.pos}</p>
                  </div>
                </div>
                {/* Mobile: mini field */}
                <div className="lg:hidden">
                  <FieldPreview fieldPositions={fieldPositions} startingXI={startingXI} captain={captain} size="small" />
                </div>
                {/* Kick Off */}
                <button onClick={() => onStartMatch({ formation, tactic, captain, startingXI })} disabled={!isReady}
                  className="w-full py-4 lg:py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold font-condensed rounded-xl lg:rounded-2xl text-lg lg:text-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
                  ⚽ KICK OFF!
                </button>
                <button onClick={() => setStep('tactics')} className="w-full py-2 text-sm text-gray-500 font-condensed">← Kembali ke Taktik</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
