'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Target, Shield, TrendingUp } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function MatchTeamStats({ match }) {
  const [homeStats, setHomeStats] = useState(null);
  const [awayStats, setAwayStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const homeTeamId = match?.home_team_id;
  const awayTeamId = match?.away_team_id;
  const leagueId = match?.league_id;

  // Calculate current season
  const now = new Date();
  const season = match?.season || (now.getMonth() + 1 < 8 ? now.getFullYear() - 1 : now.getFullYear());

  useEffect(() => {
    const fetchTeamStats = async () => {
      if (!homeTeamId || !awayTeamId || !leagueId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch both teams' stats in parallel
        const [homeRes, awayRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/teams/statistics?team=${homeTeamId}&league=${leagueId}&season=${season}`),
          fetch(`${API_BASE_URL}/api/teams/statistics?team=${awayTeamId}&league=${leagueId}&season=${season}`)
        ]);

        const homeData = await homeRes.json();
        const awayData = await awayRes.json();

        console.log('📊 Home team stats:', homeData);
        console.log('📊 Away team stats:', awayData);

        if (homeData.success && homeData.statistics) {
          setHomeStats(homeData.statistics);
        }
        if (awayData.success && awayData.statistics) {
          setAwayStats(awayData.statistics);
        }
      } catch (err) {
        console.error('Error fetching team stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamStats();
  }, [homeTeamId, awayTeamId, leagueId, season]);

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-40 mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!homeStats && !awayStats) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-semibold text-gray-800 mb-3 font-condensed flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-500" />
          Statistik Musim
        </h3>
        <div className="text-center py-6">
          <span className="text-3xl mb-2 block">📊</span>
          <p className="text-sm text-gray-500 font-condensed">Statistik belum tersedia</p>
        </div>
      </div>
    );
  }

  const homeTeam = match?.home_team_name || match?.home_team || homeStats?.team?.name || 'Home';
  const awayTeam = match?.away_team_name || match?.away_team || awayStats?.team?.name || 'Away';
  const homeLogo = match?.home_team_logo || homeStats?.team?.logo;
  const awayLogo = match?.away_team_logo || awayStats?.team?.logo;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 font-condensed flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-500" />
          Statistik Musim {season}/{season + 1}
        </h3>
        <p className="text-xs text-gray-400 font-condensed mt-1">
          Perbandingan performa kedua tim di liga
        </p>
      </div>

      {/* Team Headers */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {homeLogo ? (
            <img src={homeLogo} alt={homeTeam} className="w-8 h-8 object-contain" />
          ) : (
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          )}
          <span className="text-sm font-semibold text-gray-800 font-condensed truncate">{homeTeam}</span>
        </div>
        <div className="text-center text-xs text-gray-500 font-condensed self-center">
          VS
        </div>
        <div className="flex items-center gap-2 justify-end">
          <span className="text-sm font-semibold text-gray-800 font-condensed truncate">{awayTeam}</span>
          {awayLogo ? (
            <img src={awayLogo} alt={awayTeam} className="w-8 h-8 object-contain" />
          ) : (
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          )}
        </div>
      </div>

      {/* Stats Comparison */}
      <div className="p-4 space-y-4">
        {/* Matches Played */}
        <StatRow 
          label="Pertandingan"
          homeValue={homeStats?.fixtures?.played?.total || 0}
          awayValue={awayStats?.fixtures?.played?.total || 0}
        />

        {/* Wins */}
        <StatRow 
          label="Menang"
          homeValue={homeStats?.fixtures?.wins?.total || 0}
          awayValue={awayStats?.fixtures?.wins?.total || 0}
          colorHome="text-green-600"
          colorAway="text-green-600"
        />

        {/* Draws */}
        <StatRow 
          label="Seri"
          homeValue={homeStats?.fixtures?.draws?.total || 0}
          awayValue={awayStats?.fixtures?.draws?.total || 0}
          colorHome="text-gray-500"
          colorAway="text-gray-500"
        />

        {/* Losses */}
        <StatRow 
          label="Kalah"
          homeValue={homeStats?.fixtures?.loses?.total || 0}
          awayValue={awayStats?.fixtures?.loses?.total || 0}
          colorHome="text-red-500"
          colorAway="text-red-500"
        />

        <div className="border-t border-gray-100 pt-4">
          {/* Goals For */}
          <StatRow 
            label="Cetak Gol"
            homeValue={homeStats?.goals?.for?.total?.total || 0}
            awayValue={awayStats?.goals?.for?.total?.total || 0}
            icon={<Target className="w-3 h-3" />}
          />

          {/* Goals Against */}
          <StatRow 
            label="Kebobolan"
            homeValue={homeStats?.goals?.against?.total?.total || 0}
            awayValue={awayStats?.goals?.against?.total?.total || 0}
            icon={<Shield className="w-3 h-3" />}
          />

          {/* Goals per game */}
          <StatRow 
            label="Gol/Pertandingan"
            homeValue={homeStats?.goals?.for?.average?.total || '0'}
            awayValue={awayStats?.goals?.for?.average?.total || '0'}
          />

          {/* Clean Sheets */}
          <StatRow 
            label="Clean Sheet"
            homeValue={homeStats?.clean_sheet?.total || 0}
            awayValue={awayStats?.clean_sheet?.total || 0}
          />
        </div>

        {/* Form */}
        <div className="border-t border-gray-100 pt-4">
          <div className="text-center mb-2">
            <span className="text-xs text-gray-500 font-condensed flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Form Terakhir
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex justify-start">
              <FormBadges form={homeStats?.form || ''} />
            </div>
            <div></div>
            <div className="flex justify-end">
              <FormBadges form={awayStats?.form || ''} />
            </div>
          </div>
        </div>

        {/* Most Used Formation */}
        {(homeStats?.lineups?.length > 0 || awayStats?.lineups?.length > 0) && (
          <div className="border-t border-gray-100 pt-4">
            <div className="text-center mb-2">
              <span className="text-xs text-gray-500 font-condensed">Formasi Favorit</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-left">
                <span className="text-sm font-bold text-gray-800 font-condensed">
                  {homeStats?.lineups?.[0]?.formation || '-'}
                </span>
                {homeStats?.lineups?.[0]?.played && (
                  <span className="text-xs text-gray-400 ml-1">({homeStats.lineups[0].played}x)</span>
                )}
              </div>
              <div></div>
              <div className="text-right">
                <span className="text-sm font-bold text-gray-800 font-condensed">
                  {awayStats?.lineups?.[0]?.formation || '-'}
                </span>
                {awayStats?.lineups?.[0]?.played && (
                  <span className="text-xs text-gray-400 ml-1">({awayStats.lineups[0].played}x)</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Stat row component
function StatRow({ label, homeValue, awayValue, colorHome = 'text-gray-800', colorAway = 'text-gray-800', icon }) {
  const homeNum = parseFloat(homeValue) || 0;
  const awayNum = parseFloat(awayValue) || 0;
  const total = homeNum + awayNum || 1;
  const homeWidth = (homeNum / total) * 100;
  const awayWidth = (awayNum / total) * 100;

  return (
    <div className="mb-3">
      <div className="grid grid-cols-3 gap-4 mb-1">
        <span className={`text-sm font-bold font-condensed ${colorHome}`}>{homeValue}</span>
        <span className="text-xs text-gray-500 font-condensed text-center flex items-center justify-center gap-1">
          {icon} {label}
        </span>
        <span className={`text-sm font-bold font-condensed text-right ${colorAway}`}>{awayValue}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100">
        <div 
          className="bg-green-500 transition-all duration-500"
          style={{ width: `${homeWidth}%` }}
        ></div>
        <div 
          className="bg-blue-500 transition-all duration-500 ml-auto"
          style={{ width: `${awayWidth}%` }}
        ></div>
      </div>
    </div>
  );
}

// Form badges component
function FormBadges({ form }) {
  if (!form) return <span className="text-xs text-gray-400">-</span>;

  const results = form.slice(-5).split('');

  return (
    <div className="flex gap-0.5">
      {results.map((result, idx) => {
        let bgColor = 'bg-gray-300';
        let textColor = 'text-gray-600';

        if (result === 'W') {
          bgColor = 'bg-green-500';
          textColor = 'text-white';
        } else if (result === 'L') {
          bgColor = 'bg-red-500';
          textColor = 'text-white';
        } else if (result === 'D') {
          bgColor = 'bg-yellow-400';
          textColor = 'text-gray-800';
        }

        return (
          <span
            key={idx}
            className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded ${bgColor} ${textColor}`}
          >
            {result}
          </span>
        );
      })}
    </div>
  );
}
