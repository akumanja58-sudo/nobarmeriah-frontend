'use client';

import { useState } from 'react';
import { Star, ChevronDown, ChevronUp } from 'lucide-react';

export default function SofaMatchList({ matches = [], onMatchClick, selectedMatch }) {
  const [expandedLeagues, setExpandedLeagues] = useState({});
  const [favoriteMatches, setFavoriteMatches] = useState([]);

  // ============================================================
  // LEAGUE TIER SYSTEM - Liga besar di atas!
  // Format: { name: 'League Name', country: 'Country' } atau string untuk universal
  // ============================================================

  // TIER 1 - Liga Elite (harus match NAMA + NEGARA!)
  const TIER_1_EXACT = [
    { name: 'Premier League', country: 'England' },
    { name: 'La Liga', country: 'Spain' },
    { name: 'Serie A', country: 'Italy' },
    { name: 'Bundesliga', country: 'Germany' },
    { name: 'Ligue 1', country: 'France' },
    { name: 'Eredivisie', country: 'Netherlands' },
    { name: 'Primeira Liga', country: 'Portugal' },
    { name: 'Liga Portugal', country: 'Portugal' },
  ];

  // TIER 1 - Kompetisi internasional (nama aja, gak perlu country)
  const TIER_1_INTERNATIONAL = [
    'UEFA Champions League', 'Champions League',
    'UEFA Europa League', 'Europa League',
    'UEFA Europa Conference League', 'Conference League',
    'World Cup', 'FIFA World Cup',
    'UEFA Euro', 'Euro Championship', 'European Championship',
    'Copa America', 'Africa Cup of Nations', 'AFCON',
    'AFC Asian Cup', 'Asian Cup',
    'UEFA Nations League', 'Nations League',
    'World Cup - Qualification', 'WC Qualification',
    'CONMEBOL Libertadores', 'Copa Libertadores',
    'CONMEBOL Sudamericana', 'Copa Sudamericana',
  ];

  // TIER 2 - Liga bagus lainnya
  const TIER_2_EXACT = [
    { name: 'Championship', country: 'England' },
    { name: 'La Liga 2', country: 'Spain' },
    { name: 'Serie B', country: 'Italy' },
    { name: '2. Bundesliga', country: 'Germany' },
    { name: 'Ligue 2', country: 'France' },
    { name: 'Super Lig', country: 'Turkey' },
    { name: 'Belgian Pro League', country: 'Belgium' },
    { name: 'Scottish Premiership', country: 'Scotland' },
    { name: 'Liga 1', country: 'Indonesia' },
    { name: 'MLS', country: 'USA' },
    { name: 'Saudi Pro League', country: 'Saudi-Arabia' },
    { name: 'Brasileirão', country: 'Brazil' },
    { name: 'Serie A', country: 'Brazil' },
    { name: 'Liga MX', country: 'Mexico' },
    { name: 'Argentine Primera', country: 'Argentina' },
    { name: 'J1 League', country: 'Japan' },
    { name: 'K League 1', country: 'South-Korea' },
    { name: 'A-League', country: 'Australia' },
    { name: 'Superliga', country: 'Denmark' },
    { name: 'Allsvenskan', country: 'Sweden' },
    { name: 'Eliteserien', country: 'Norway' },
  ];

  // TIER 99 - Paling bawah (Friendlies)
  const BOTTOM_TIER_KEYWORDS = [
    'Friendlies', 'Friendly', 'Club Friendlies', 'International Friendlies',
    'Practice', 'Warm Up', 'Test Match', 'Exhibition',
  ];

  // Determine league tier - FIXED VERSION!
  function getLeagueTier(leagueName, country) {
    if (!leagueName) return 50;
    const nameLower = leagueName.toLowerCase();
    const countryLower = (country || '').toLowerCase();

    // TIER 99 - Friendlies paling bawah!
    for (const keyword of BOTTOM_TIER_KEYWORDS) {
      if (nameLower.includes(keyword.toLowerCase())) return 99;
    }

    // TIER 1 - Check exact match (nama + negara)
    for (const league of TIER_1_EXACT) {
      if (nameLower.includes(league.name.toLowerCase()) &&
        countryLower === league.country.toLowerCase()) {
        return 1;
      }
    }

    // TIER 1 - International competitions (nama aja)
    for (const league of TIER_1_INTERNATIONAL) {
      if (nameLower.includes(league.toLowerCase())) {
        return 1;
      }
    }

    // TIER 2 - Check exact match (nama + negara)
    for (const league of TIER_2_EXACT) {
      if (nameLower.includes(league.name.toLowerCase()) &&
        countryLower === league.country.toLowerCase()) {
        return 2;
      }
    }

    // TIER 3 - Cup competitions dari negara besar
    const bigCountries = ['england', 'spain', 'italy', 'germany', 'france'];
    if (bigCountries.includes(countryLower) && nameLower.includes('cup')) {
      return 3;
    }

    // TIER 4 - Liga apapun dari negara besar
    if (bigCountries.includes(countryLower)) {
      return 4;
    }

    // TIER 5 - Default untuk liga lainnya
    return 5;
  }

  // Group matches by league - PAKAI DATA REAL DARI API!
  const groupedMatches = matches.reduce((acc, match) => {
    const leagueId = match.league_id || 'unknown';
    const league = match.league_name || match.league || 'Other';
    const country = match.league_country || match.country || 'Internasional';
    const key = `${leagueId}-${league}`;

    if (!acc[key]) {
      acc[key] = {
        leagueId,
        country,
        league,
        leagueLogo: match.league_logo,
        leagueFlag: match.league_flag,
        tier: getLeagueTier(league, country),
        matches: []
      };
    }
    acc[key].matches.push(match);
    return acc;
  }, {});

  // SORT LEAGUES BY TIER! Liga besar di atas
  const sortedLeagues = Object.entries(groupedMatches).sort((a, b) => {
    const tierA = a[1].tier;
    const tierB = b[1].tier;

    // Sort by tier first
    if (tierA !== tierB) return tierA - tierB;

    // Same tier, sort by country then league name
    const countryCompare = a[1].country.localeCompare(b[1].country);
    if (countryCompare !== 0) return countryCompare;

    return a[1].league.localeCompare(b[1].league);
  });

  // Translate country name ke Bahasa Indonesia
  function translateCountry(country) {
    const translations = {
      'England': 'Inggris',
      'Spain': 'Spanyol',
      'Italy': 'Italia',
      'Germany': 'Jerman',
      'France': 'Prancis',
      'Indonesia': 'Indonesia',
      'Netherlands': 'Belanda',
      'Portugal': 'Portugal',
      'Turkey': 'Turki',
      'Scotland': 'Skotlandia',
      'Mexico': 'Meksiko',
      'Brazil': 'Brasil',
      'Argentina': 'Argentina',
      'USA': 'Amerika Serikat',
      'Saudi-Arabia': 'Arab Saudi',
      'World': 'Dunia',
      'Europe': 'Eropa',
      'Africa': 'Afrika',
      'Asia': 'Asia',
      'Syria': 'Suriah',
      'Kuwait': 'Kuwait',
      'Bahrain': 'Bahrain',
      'Ethiopia': 'Ethiopia',
      'Egypt': 'Mesir',
      'Morocco': 'Maroko',
      'South-Africa': 'Afrika Selatan',
      'Nigeria': 'Nigeria',
      'Ghana': 'Ghana',
      'Japan': 'Jepang',
      'South-Korea': 'Korea Selatan',
      'China': 'Tiongkok',
      'Australia': 'Australia',
      'Belgium': 'Belgia',
      'Russia': 'Rusia',
      'Ukraine': 'Ukraina',
      'Poland': 'Polandia',
      'Greece': 'Yunani',
      'Czech-Republic': 'Ceko',
      'Austria': 'Austria',
      'Switzerland': 'Swiss',
      'Denmark': 'Denmark',
      'Sweden': 'Swedia',
      'Norway': 'Norwegia',
      'Finland': 'Finlandia',
      'Croatia': 'Kroasia',
      'Serbia': 'Serbia',
      'Romania': 'Rumania',
      'Hungary': 'Hungaria',
      'Bulgaria': 'Bulgaria',
      'Slovakia': 'Slovakia',
      'Slovenia': 'Slovenia',
      'Israel': 'Israel',
      'UAE': 'Uni Emirat Arab',
      'United-Arab-Emirates': 'Uni Emirat Arab',
      'Qatar': 'Qatar',
      'Iran': 'Iran',
      'Iraq': 'Irak',
      'Jordan': 'Yordania',
      'Lebanon': 'Lebanon',
      'Tunisia': 'Tunisia',
      'Algeria': 'Aljazair',
      'Cameroon': 'Kamerun',
      'Senegal': 'Senegal',
      'Ivory-Coast': 'Pantai Gading',
      'Colombia': 'Kolombia',
      'Chile': 'Chili',
      'Peru': 'Peru',
      'Ecuador': 'Ekuador',
      'Uruguay': 'Uruguay',
      'Paraguay': 'Paraguay',
      'Bolivia': 'Bolivia',
      'Venezuela': 'Venezuela',
      'Costa-Rica': 'Kosta Rika',
      'Honduras': 'Honduras',
      'Jamaica': 'Jamaika',
      'Canada': 'Kanada',
      'India': 'India',
      'Thailand': 'Thailand',
      'Vietnam': 'Vietnam',
      'Malaysia': 'Malaysia',
      'Singapore': 'Singapura',
      'Philippines': 'Filipina',
      'Congo-DR': 'Kongo',
      'Congo': 'Kongo',
      'Mali': 'Mali',
      'Kenya': 'Kenya',
      'Gambia': 'Gambia',
      'Zambia': 'Zambia',
      'Sudan': 'Sudan',
      'Oman': 'Oman',
      'Albania': 'Albania',
    };

    return translations[country] || country;
  }

  function formatMatchTime(match) {
    const status = match.status_short || match.status || '';

    // Live match
    if (['1H', '2H', 'HT', 'LIVE', 'ET', 'BT', 'P'].includes(status.toUpperCase()) || match.is_live) {
      if (status.toUpperCase() === 'HT') return 'HT';
      if (match.elapsed) return `${match.elapsed}'`;
      if (match.minute) return `${match.minute}'`;
      return 'LIVE';
    }

    // Finished
    if (['FT', 'AET', 'PEN'].includes(status.toUpperCase())) {
      return 'FT';
    }

    // Not started - show time
    const kickoff = match.date || match.kickoff || match.timestamp;
    if (kickoff) {
      const date = new Date(kickoff);
      return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }

    return status || '-';
  }

  function isLiveMatch(match) {
    const status = match.status_short || match.status || '';
    return ['1H', '2H', 'HT', 'LIVE', 'ET', 'BT', 'P'].includes(status.toUpperCase()) || match.is_live;
  }

  function isFinishedMatch(match) {
    const status = match.status_short || match.status || '';
    return ['FT', 'AET', 'PEN'].includes(status.toUpperCase());
  }

  const toggleLeague = (key) => {
    setExpandedLeagues(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleFavorite = (e, matchId) => {
    e.stopPropagation();
    setFavoriteMatches(prev =>
      prev.includes(matchId)
        ? prev.filter(id => id !== matchId)
        : [...prev, matchId]
    );
  };

  return (
    <div className="sofa-match-list bg-white rounded-xl shadow-sm overflow-hidden">
      {sortedLeagues.map(([key, group]) => (
        <div key={key} className="league-group">
          {/* League Header */}
          <div
            className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => toggleLeague(key)}
          >
            <div className="flex items-center gap-3">
              {/* Flag dari API atau emoji fallback */}
              {group.leagueFlag ? (
                <img
                  src={group.leagueFlag}
                  alt={group.country}
                  className="w-5 h-4 object-cover rounded-sm"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <span className="text-lg">🌍</span>
              )}
              <div>
                <p className="text-xs text-gray-500 font-condensed">{translateCountry(group.country)}</p>
                <p className="text-sm font-semibold text-gray-800 font-condensed">{group.league}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                onClick={(e) => { e.stopPropagation(); }}
              >
                <Star className="w-4 h-4 text-gray-400 hover:text-yellow-500" />
              </button>
              {expandedLeagues[key] ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>

          {/* Matches */}
          {!expandedLeagues[key] && (
            <div className="matches">
              {group.matches.map((match) => {
                const matchId = match.id || match.match_id;
                const isLive = isLiveMatch(match);
                const isFinished = isFinishedMatch(match);
                const isSelected = selectedMatch?.id === matchId;
                const isFavorite = favoriteMatches.includes(matchId);

                return (
                  <div
                    key={matchId}
                    className={`match-row flex items-center px-4 py-3 border-b border-gray-50 cursor-pointer transition-all ${isSelected
                      ? 'bg-green-50 border-l-4 border-l-green-500'
                      : 'hover:bg-gray-50'
                      }`}
                    onClick={() => onMatchClick?.(match)}
                  >
                    {/* Time / Status */}
                    <div className="w-14 flex-shrink-0 text-center">
                      {isLive ? (
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-condensed">
                            {formatMatchTime(match)}
                          </span>
                        </div>
                      ) : isFinished ? (
                        <span className="text-xs font-medium text-gray-500 font-condensed">
                          {formatMatchTime(match)}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-gray-600 font-condensed">
                          {formatMatchTime(match)}
                        </span>
                      )}
                    </div>

                    {/* Teams */}
                    <div className="flex-1 min-w-0">
                      {/* Home Team */}
                      <div className="flex items-center gap-2 mb-1">
                        {match.home_team_logo || match.home_logo ? (
                          <img
                            src={match.home_team_logo || match.home_logo}
                            alt=""
                            className="w-4 h-4 object-contain"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-4 h-4 bg-gray-200 rounded-full flex-shrink-0"></div>
                        )}
                        <span className={`text-sm truncate font-condensed ${isFinished && (match.home_score > match.away_score)
                          ? 'font-bold text-gray-900'
                          : 'text-gray-700'
                          }`}>
                          {match.home_team_name || match.home_team || 'Home'}
                        </span>
                      </div>

                      {/* Away Team */}
                      <div className="flex items-center gap-2">
                        {match.away_team_logo || match.away_logo ? (
                          <img
                            src={match.away_team_logo || match.away_logo}
                            alt=""
                            className="w-4 h-4 object-contain"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-4 h-4 bg-gray-200 rounded-full flex-shrink-0"></div>
                        )}
                        <span className={`text-sm truncate font-condensed ${isFinished && (match.away_score > match.home_score)
                          ? 'font-bold text-gray-900'
                          : 'text-gray-700'
                          }`}>
                          {match.away_team_name || match.away_team || 'Away'}
                        </span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="w-12 flex-shrink-0 text-right">
                      {(isLive || isFinished) ? (
                        <div className="flex flex-col items-end">
                          <span className={`text-sm font-condensed ${isLive ? 'font-bold text-red-600' :
                            (match.home_score > match.away_score) ? 'font-bold text-gray-900' : 'text-gray-600'
                            }`}>
                            {match.home_score ?? 0}
                          </span>
                          <span className={`text-sm font-condensed ${isLive ? 'font-bold text-red-600' :
                            (match.away_score > match.home_score) ? 'font-bold text-gray-900' : 'text-gray-600'
                            }`}>
                            {match.away_score ?? 0}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>

                    {/* Favorite */}
                    <div className="w-8 flex-shrink-0 flex justify-end">
                      <button
                        onClick={(e) => toggleFavorite(e, matchId)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Star className={`w-4 h-4 ${isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 hover:text-gray-400'
                          }`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Empty State */}
      {sortedLeagues.length === 0 && (
        <div className="text-center py-12">
          <span className="text-4xl mb-4 block">⚽</span>
          <p className="text-gray-500 font-condensed">Tidak ada pertandingan</p>
        </div>
      )}
    </div>
  );
}
