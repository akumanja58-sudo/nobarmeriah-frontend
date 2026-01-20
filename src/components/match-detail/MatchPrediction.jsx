'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Target, Shield, Zap, BarChart3 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// ============================================================
// RADAR CHART COMPONENT
// ============================================================
function RadarChart({ homeStats, awayStats, homeTeam, awayTeam, homeLogo, awayLogo }) {
  const categories = [
    { key: 'attack', label: 'Serangan' },
    { key: 'defense', label: 'Pertahanan' },
    { key: 'form', label: 'Form' },
    { key: 'h2h', label: 'H2H' },
    { key: 'goals', label: 'Gol' },
    { key: 'total', label: 'Total' },
  ];

  // Parse percentage ke number
  const parsePercent = (val) => parseInt((val || '0%').replace('%', '')) || 0;

  // Hitung koordinat untuk radar chart
  const centerX = 120;
  const centerY = 120;
  const maxRadius = 80;
  const angleStep = (2 * Math.PI) / categories.length;
  const startAngle = -Math.PI / 2; // Start dari atas

  // Generate points untuk polygon
  const getPolygonPoints = (stats) => {
    return categories.map((cat, i) => {
      const value = parsePercent(stats[cat.key]) / 100;
      const angle = startAngle + i * angleStep;
      const radius = value * maxRadius;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  // Generate grid lines
  const gridLevels = [0.25, 0.5, 0.75, 1];

  // Generate axis lines dan labels
  const axisLines = categories.map((cat, i) => {
    const angle = startAngle + i * angleStep;
    const x2 = centerX + maxRadius * Math.cos(angle);
    const y2 = centerY + maxRadius * Math.sin(angle);
    const labelX = centerX + (maxRadius + 20) * Math.cos(angle);
    const labelY = centerY + (maxRadius + 20) * Math.sin(angle);
    return { x1: centerX, y1: centerY, x2, y2, labelX, labelY, label: cat.label };
  });

  return (
    <div className="p-4 border-b border-gray-100">
      <p className="text-xs text-gray-500 mb-3 font-condensed flex items-center gap-1">
        📊 Perbandingan Kekuatan
      </p>

      {/* Legend */}
      <div className="flex justify-center gap-6 mb-3">
        <div className="flex items-center gap-2">
          {homeLogo && <img src={homeLogo} alt={homeTeam} className="w-4 h-4 object-contain" />}
          <span className="text-xs font-condensed text-green-600 font-medium">{homeTeam}</span>
        </div>
        <div className="flex items-center gap-2">
          {awayLogo && <img src={awayLogo} alt={awayTeam} className="w-4 h-4 object-contain" />}
          <span className="text-xs font-condensed text-blue-600 font-medium">{awayTeam}</span>
        </div>
      </div>

      {/* Radar Chart SVG */}
      <div className="flex justify-center">
        <svg width="240" height="240" viewBox="0 0 240 240">
          {/* Grid circles */}
          {gridLevels.map((level, i) => (
            <polygon
              key={i}
              points={categories.map((_, idx) => {
                const angle = startAngle + idx * angleStep;
                const radius = level * maxRadius;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          ))}

          {/* Axis lines */}
          {axisLines.map((axis, i) => (
            <line
              key={i}
              x1={axis.x1}
              y1={axis.y1}
              x2={axis.x2}
              y2={axis.y2}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          ))}

          {/* Home team polygon */}
          <polygon
            points={getPolygonPoints(homeStats)}
            fill="rgba(34, 197, 94, 0.3)"
            stroke="#22C55E"
            strokeWidth="2"
          />

          {/* Away team polygon */}
          <polygon
            points={getPolygonPoints(awayStats)}
            fill="rgba(59, 130, 246, 0.3)"
            stroke="#3B82F6"
            strokeWidth="2"
          />

          {/* Labels */}
          {axisLines.map((axis, i) => (
            <text
              key={i}
              x={axis.labelX}
              y={axis.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[9px] fill-gray-500 font-condensed"
            >
              {axis.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

export default function MatchPrediction({ match }) {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fixtureId = match?.id || match?.fixture_id || match?.match_id;

  useEffect(() => {
    const fetchPredictions = async () => {
      if (!fixtureId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const url = `${API_BASE_URL}/api/predictions?fixture=${fixtureId}`;
        console.log('🔮 Fetching predictions from:', url);

        const response = await fetch(url);

        if (!response.ok) throw new Error('Failed to fetch predictions');

        const data = await response.json();
        console.log('🔮 Predictions data:', data);

        if (data.success && data.predictions) {
          setPredictions(data.predictions);
        }
      } catch (err) {
        console.error('Error fetching predictions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [fixtureId]);

  // Parse percentage string to number
  const parsePercent = (str) => {
    if (!str) return 0;
    return parseInt(str.replace('%', '')) || 0;
  };

  // Generate score prediction based on percentages and under/over
  const getScorePrediction = () => {
    // Coba extract score dari API kalau ada
    if (predictions?.score?.fulltime) {
      return {
        home: predictions.score.fulltime.home,
        away: predictions.score.fulltime.away
      };
    }

    const homePercent = parsePercent(predictions?.percent?.home);
    const drawPercent = parsePercent(predictions?.percent?.draw);
    const awayPercent = parsePercent(predictions?.percent?.away);

    // Parse under/over untuk estimasi total gol
    const underOver = parseFloat(predictions?.under_over) || 2.5;

    // Use fixtureId as seed for consistent "randomness" per match
    const seed = fixtureId ? parseInt(String(fixtureId).slice(-3)) : 0;

    // Possible scores based on total goals expectation
    const lowScores = [
      { home: 1, away: 0 }, { home: 0, away: 1 }, { home: 1, away: 1 },
      { home: 0, away: 0 }, { home: 2, away: 0 }, { home: 0, away: 2 },
      { home: 2, away: 1 }, { home: 1, away: 2 }
    ];

    const midScores = [
      { home: 2, away: 1 }, { home: 1, away: 2 }, { home: 2, away: 2 },
      { home: 3, away: 1 }, { home: 1, away: 3 }, { home: 2, away: 0 },
      { home: 0, away: 2 }, { home: 3, away: 0 }, { home: 0, away: 3 }
    ];

    const highScores = [
      { home: 3, away: 2 }, { home: 2, away: 3 }, { home: 3, away: 1 },
      { home: 1, away: 3 }, { home: 4, away: 1 }, { home: 1, away: 4 },
      { home: 3, away: 3 }, { home: 4, away: 2 }, { home: 2, away: 4 }
    ];

    // Select score pool based on under/over
    let scorePool;
    if (underOver <= 2.0) {
      scorePool = lowScores;
    } else if (underOver <= 3.0) {
      scorePool = midScores;
    } else {
      scorePool = highScores;
    }

    // Filter based on winner prediction
    let filteredScores;
    if (drawPercent > 35) {
      // High draw chance - filter for draws
      filteredScores = scorePool.filter(s => s.home === s.away);
      if (filteredScores.length === 0) filteredScores = [{ home: 1, away: 1 }, { home: 2, away: 2 }];
    } else if (homePercent > awayPercent + 15) {
      // Strong home favorite
      filteredScores = scorePool.filter(s => s.home > s.away);
    } else if (awayPercent > homePercent + 15) {
      // Strong away favorite
      filteredScores = scorePool.filter(s => s.away > s.home);
    } else if (homePercent > awayPercent) {
      // Slight home favorite
      filteredScores = scorePool.filter(s => s.home >= s.away);
    } else if (awayPercent > homePercent) {
      // Slight away favorite
      filteredScores = scorePool.filter(s => s.away >= s.home);
    } else {
      // Equal - could go either way
      filteredScores = scorePool;
    }

    // Fallback
    if (filteredScores.length === 0) {
      filteredScores = scorePool;
    }

    // Pick score using seed for consistency (same match = same prediction)
    const selectedScore = filteredScores[seed % filteredScores.length];

    return {
      home: String(selectedScore.home),
      away: String(selectedScore.away)
    };
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!predictions) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-semibold text-gray-800 mb-3 font-condensed flex items-center gap-2">
          <Target className="w-4 h-4 text-green-500" />
          Prediksi Pertandingan
        </h3>
        <div className="text-center py-4">
          <span className="text-3xl mb-2 block">🔮</span>
          <p className="text-sm text-gray-500 font-condensed">Prediksi belum tersedia</p>
        </div>
      </div>
    );
  }

  const homePercent = parsePercent(predictions.percent?.home);
  const drawPercent = parsePercent(predictions.percent?.draw);
  const awayPercent = parsePercent(predictions.percent?.away);

  const homeTeam = match?.home_team_name || match?.home_team || predictions.teams?.home?.name || 'Home';
  const awayTeam = match?.away_team_name || match?.away_team || predictions.teams?.away?.name || 'Away';
  const homeLogo = match?.home_team_logo || predictions.teams?.home?.logo;
  const awayLogo = match?.away_team_logo || predictions.teams?.away?.logo;

  // Get score prediction
  const scorePrediction = getScorePrediction();

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 font-condensed flex items-center gap-2">
          <Target className="w-4 h-4 text-green-500" />
          Prediksi Pertandingan
        </h3>
      </div>

      {/* Win Probability */}
      <div className="p-4 border-b border-gray-100">
        <p className="text-xs text-gray-500 mb-3 font-condensed">Peluang Menang</p>

        {/* Home */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {homeLogo ? (
                  <img src={homeLogo} alt={homeTeam} className="w-5 h-5 object-contain" />
                ) : (
                  <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                )}
                <span className="text-xs font-condensed text-gray-700">{homeTeam}</span>
              </div>
              <span className="text-sm font-bold text-green-600 font-condensed">{predictions.percent?.home}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${homePercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Draw */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-condensed text-gray-500">Seri</span>
              <span className="text-sm font-bold text-gray-500 font-condensed">{predictions.percent?.draw}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-400 rounded-full transition-all duration-500"
                style={{ width: `${drawPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Away */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {awayLogo ? (
                  <img src={awayLogo} alt={awayTeam} className="w-5 h-5 object-contain" />
                ) : (
                  <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                )}
                <span className="text-xs font-condensed text-gray-700">{awayTeam}</span>
              </div>
              <span className="text-sm font-bold text-blue-600 font-condensed">{predictions.percent?.away}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${awayPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Advice */}
      {predictions.advice && (
        <div className="p-4 border-b border-gray-100 bg-green-50">
          <p className="text-xs text-gray-500 mb-1 font-condensed">💡 Saran</p>
          <p className="text-sm font-medium text-green-700 font-condensed">{predictions.advice}</p>
        </div>
      )}

      {/* Score Prediction */}
      <div className="p-4 border-b border-gray-100">
        <p className="text-xs text-gray-500 mb-2 font-condensed">Prediksi Skor</p>
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            {homeLogo && <img src={homeLogo} alt={homeTeam} className="w-8 h-8 object-contain mx-auto mb-1" />}
            <span className="text-2xl font-bold text-gray-800 font-condensed">{scorePrediction.home}</span>
          </div>
          <span className="text-gray-400 text-lg">-</span>
          <div className="text-center">
            {awayLogo && <img src={awayLogo} alt={awayTeam} className="w-8 h-8 object-contain mx-auto mb-1" />}
            <span className="text-2xl font-bold text-gray-800 font-condensed">{scorePrediction.away}</span>
          </div>
        </div>
        {predictions.under_over && (
          <p className="text-center text-xs text-gray-500 mt-2 font-condensed">
            Over/Under: <span className="font-medium">{predictions.under_over}</span>
          </p>
        )}
      </div>

      {/* Radar Chart - Perbandingan Kekuatan */}
      {predictions.comparison && (
        <RadarChart
          homeStats={{
            attack: predictions.comparison?.att?.home || predictions.comparison?.attack?.home,
            defense: predictions.comparison?.def?.home || predictions.comparison?.defense?.home,
            form: predictions.comparison?.form?.home,
            h2h: predictions.comparison?.h2h?.home,
            goals: predictions.comparison?.goals?.home || predictions.comparison?.poisson_distribution?.home,
            total: predictions.comparison?.total?.home,
          }}
          awayStats={{
            attack: predictions.comparison?.att?.away || predictions.comparison?.attack?.away,
            defense: predictions.comparison?.def?.away || predictions.comparison?.defense?.away,
            form: predictions.comparison?.form?.away,
            h2h: predictions.comparison?.h2h?.away,
            goals: predictions.comparison?.goals?.away || predictions.comparison?.poisson_distribution?.away,
            total: predictions.comparison?.total?.away,
          }}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          homeLogo={homeLogo}
          awayLogo={awayLogo}
        />
      )}

      {/* Team Comparison */}
      <div className="p-4">
        <p className="text-xs text-gray-500 mb-3 font-condensed flex items-center gap-1">
          <BarChart3 className="w-3 h-3" />
          Perbandingan Tim
        </p>

        <div className="space-y-3">
          {/* Form */}
          <ComparisonBar
            label="Form"
            icon={<TrendingUp className="w-3 h-3" />}
            home={predictions.comparison?.form?.home}
            away={predictions.comparison?.form?.away}
          />

          {/* Attack */}
          <ComparisonBar
            label="Serangan"
            icon={<Zap className="w-3 h-3" />}
            home={predictions.comparison?.attack?.home}
            away={predictions.comparison?.attack?.away}
          />

          {/* Defense */}
          <ComparisonBar
            label="Pertahanan"
            icon={<Shield className="w-3 h-3" />}
            home={predictions.comparison?.defense?.home}
            away={predictions.comparison?.defense?.away}
          />

          {/* H2H */}
          <ComparisonBar
            label="Head to Head"
            icon={<span className="text-[10px]">⚔️</span>}
            home={predictions.comparison?.h2h?.home}
            away={predictions.comparison?.h2h?.away}
          />

          {/* Total */}
          <ComparisonBar
            label="Total"
            icon={<span className="text-[10px]">📊</span>}
            home={predictions.comparison?.total?.home}
            away={predictions.comparison?.total?.away}
            highlight
          />
        </div>
      </div>
    </div>
  );
}

// Comparison bar component
function ComparisonBar({ label, icon, home, away, highlight = false }) {
  const homePercent = parseInt((home || '0%').replace('%', '')) || 0;
  const awayPercent = parseInt((away || '0%').replace('%', '')) || 0;

  return (
    <div className={`${highlight ? 'bg-gray-50 p-2 rounded-lg' : ''}`}>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-medium text-green-600 font-condensed">{home}</span>
        <span className="text-gray-500 font-condensed flex items-center gap-1">
          {icon} {label}
        </span>
        <span className="font-medium text-blue-600 font-condensed">{away}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-200">
        <div
          className="bg-green-500 transition-all duration-500"
          style={{ width: `${homePercent}%` }}
        ></div>
        <div
          className="bg-blue-500 transition-all duration-500 ml-auto"
          style={{ width: `${awayPercent}%` }}
        ></div>
      </div>
    </div>
  );
}
