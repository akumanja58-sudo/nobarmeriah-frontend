'use client';

export default function MatchMomentum({ homeTeam, awayTeam }) {
  // Generate sample momentum data
  const generateMomentumData = () => {
    const data = [];
    for (let i = 0; i <= 90; i += 5) {
      data.push({
        minute: i,
        home: Math.random() * 100 - 50, // -50 to 50
        away: Math.random() * -100 + 50, // -50 to 50
      });
    }
    return data;
  };

  const momentumData = generateMomentumData();

  return (
    <div className="match-momentum bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 font-condensed">Momentum serangan</h3>
        <button className="text-gray-400 hover:text-gray-600 text-sm">{'</>'}</button>
      </div>

      {/* Momentum Chart */}
      <div className="relative h-32 bg-gray-50 rounded-lg overflow-hidden">
        {/* Center line */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-300"></div>
        
        {/* Team indicators */}
        <div className="absolute top-2 left-2 flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-xs text-gray-500 font-condensed">{homeTeam || 'Home'}</span>
        </div>
        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-xs text-gray-500 font-condensed">{awayTeam || 'Away'}</span>
        </div>

        {/* SVG Chart */}
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Home team momentum (top half - green) */}
          <path
            d={`M 0 50 ${momentumData.map((d, i) => {
              const x = (i / (momentumData.length - 1)) * 100;
              const y = 50 - (d.home > 0 ? d.home * 0.8 : 0);
              return `L ${x} ${y}`;
            }).join(' ')} L 100 50 Z`}
            fill="rgba(34, 197, 94, 0.3)"
            stroke="rgb(34, 197, 94)"
            strokeWidth="1"
          />
          
          {/* Away team momentum (bottom half - red) */}
          <path
            d={`M 0 50 ${momentumData.map((d, i) => {
              const x = (i / (momentumData.length - 1)) * 100;
              const y = 50 + (d.home < 0 ? Math.abs(d.home) * 0.8 : 0);
              return `L ${x} ${y}`;
            }).join(' ')} L 100 50 Z`}
            fill="rgba(239, 68, 68, 0.3)"
            stroke="rgb(239, 68, 68)"
            strokeWidth="1"
          />

          {/* Time markers */}
          {[0, 15, 30, 45, 60, 75, 90].map((minute) => (
            <g key={minute}>
              <line
                x1={(minute / 90) * 100}
                y1="0"
                x2={(minute / 90) * 100}
                y2="100"
                stroke="rgba(0,0,0,0.1)"
                strokeWidth="0.5"
              />
            </g>
          ))}
        </svg>

        {/* Time labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-[10px] text-gray-400">
          <span>0'</span>
          <span>15'</span>
          <span>30'</span>
          <span>45'</span>
          <span>60'</span>
          <span>75'</span>
          <span>90'</span>
        </div>
      </div>
    </div>
  );
}
