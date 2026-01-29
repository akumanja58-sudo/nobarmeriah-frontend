'use client';

import { useState, useEffect } from 'react';
import { Star, ChevronDown, ChevronUp } from 'lucide-react';

// ============================================================
// LOGO KHUSUS UNTUK TOURNAMENT INTERNASIONAL
// ============================================================
const INTERNATIONAL_LOGOS = {
  // UEFA Competitions
  'uefa champions league': 'https://media.api-sports.io/football/leagues/2.png',
  'champions league': 'https://media.api-sports.io/football/leagues/2.png',
  'uefa europa league': 'https://media.api-sports.io/football/leagues/3.png',
  'europa league': 'https://media.api-sports.io/football/leagues/3.png',
  'uefa europa conference league': 'https://media.api-sports.io/football/leagues/848.png',
  'conference league': 'https://media.api-sports.io/football/leagues/848.png',
  'uefa nations league': 'https://media.api-sports.io/football/leagues/5.png',
  'nations league': 'https://media.api-sports.io/football/leagues/5.png',
  'uefa super cup': 'https://media.api-sports.io/football/leagues/531.png',
  'euro championship': 'https://media.api-sports.io/football/leagues/4.png',
  'uefa euro': 'https://media.api-sports.io/football/leagues/4.png',

  // FIFA Competitions
  'fifa world cup': 'https://media.api-sports.io/football/leagues/1.png',
  'world cup': 'https://media.api-sports.io/football/leagues/1.png',
  'fifa club world cup': 'https://media.api-sports.io/football/leagues/15.png',
  'club world cup': 'https://media.api-sports.io/football/leagues/15.png',

  // Continental - Asia
  'afc champions league': 'https://media.api-sports.io/football/leagues/17.png',
  'afc cup': 'https://media.api-sports.io/football/leagues/18.png',
  'afc asian cup': 'https://media.api-sports.io/football/leagues/7.png',
  'asian cup': 'https://media.api-sports.io/football/leagues/7.png',
  'afc u23 asian cup': 'https://media.api-sports.io/football/leagues/7.png',

  // Continental - South America
  'copa libertadores': 'https://media.api-sports.io/football/leagues/13.png',
  'conmebol libertadores': 'https://media.api-sports.io/football/leagues/13.png',
  'copa sudamericana': 'https://media.api-sports.io/football/leagues/11.png',
  'conmebol sudamericana': 'https://media.api-sports.io/football/leagues/11.png',
  'copa america': 'https://media.api-sports.io/football/leagues/9.png',

  // Continental - Africa
  'africa cup of nations': 'https://media.api-sports.io/football/leagues/6.png',
  'afcon': 'https://media.api-sports.io/football/leagues/6.png',
  'caf champions league': 'https://media.api-sports.io/football/leagues/12.png',

  // Continental - North America
  'concacaf champions league': 'https://media.api-sports.io/football/leagues/16.png',
  'gold cup': 'https://media.api-sports.io/football/leagues/22.png',
  'concacaf gold cup': 'https://media.api-sports.io/football/leagues/22.png',

  // Friendlies
  'friendlies': 'https://media.api-sports.io/football/leagues/10.png',
  'club friendlies': 'https://media.api-sports.io/football/leagues/667.png',
  'international friendlies': 'https://media.api-sports.io/football/leagues/10.png',
};

// ============================================================
// BENDERA NEGARA (FALLBACK KALAU API GAK KASIH)
// ============================================================
const COUNTRY_FLAGS = {
  // Europe
  'england': 'https://media.api-sports.io/flags/gb.svg',
  'spain': 'https://media.api-sports.io/flags/es.svg',
  'italy': 'https://media.api-sports.io/flags/it.svg',
  'germany': 'https://media.api-sports.io/flags/de.svg',
  'france': 'https://media.api-sports.io/flags/fr.svg',
  'netherlands': 'https://media.api-sports.io/flags/nl.svg',
  'portugal': 'https://media.api-sports.io/flags/pt.svg',
  'belgium': 'https://media.api-sports.io/flags/be.svg',
  'turkey': 'https://media.api-sports.io/flags/tr.svg',
  'scotland': 'https://media.api-sports.io/flags/gb.svg',
  'greece': 'https://media.api-sports.io/flags/gr.svg',
  'russia': 'https://media.api-sports.io/flags/ru.svg',
  'ukraine': 'https://media.api-sports.io/flags/ua.svg',
  'poland': 'https://media.api-sports.io/flags/pl.svg',
  'austria': 'https://media.api-sports.io/flags/at.svg',
  'switzerland': 'https://media.api-sports.io/flags/ch.svg',
  'denmark': 'https://media.api-sports.io/flags/dk.svg',
  'sweden': 'https://media.api-sports.io/flags/se.svg',
  'norway': 'https://media.api-sports.io/flags/no.svg',
  'finland': 'https://media.api-sports.io/flags/fi.svg',
  'croatia': 'https://media.api-sports.io/flags/hr.svg',
  'serbia': 'https://media.api-sports.io/flags/rs.svg',
  'romania': 'https://media.api-sports.io/flags/ro.svg',
  'hungary': 'https://media.api-sports.io/flags/hu.svg',
  'czech-republic': 'https://media.api-sports.io/flags/cz.svg',
  'slovakia': 'https://media.api-sports.io/flags/sk.svg',
  'bulgaria': 'https://media.api-sports.io/flags/bg.svg',
  'cyprus': 'https://media.api-sports.io/flags/cy.svg',
  'ireland': 'https://media.api-sports.io/flags/ie.svg',
  'wales': 'https://media.api-sports.io/flags/gb.svg',

  // Asia
  'indonesia': 'https://media.api-sports.io/flags/id.svg',
  'japan': 'https://media.api-sports.io/flags/jp.svg',
  'south-korea': 'https://media.api-sports.io/flags/kr.svg',
  'korea': 'https://media.api-sports.io/flags/kr.svg',
  'china': 'https://media.api-sports.io/flags/cn.svg',
  'saudi-arabia': 'https://media.api-sports.io/flags/sa.svg',
  'uae': 'https://media.api-sports.io/flags/ae.svg',
  'qatar': 'https://media.api-sports.io/flags/qa.svg',
  'iran': 'https://media.api-sports.io/flags/ir.svg',
  'thailand': 'https://media.api-sports.io/flags/th.svg',
  'vietnam': 'https://media.api-sports.io/flags/vn.svg',
  'malaysia': 'https://media.api-sports.io/flags/my.svg',
  'singapore': 'https://media.api-sports.io/flags/sg.svg',
  'india': 'https://media.api-sports.io/flags/in.svg',
  'australia': 'https://media.api-sports.io/flags/au.svg',
  'syria': 'https://media.api-sports.io/flags/sy.svg',
  'kuwait': 'https://media.api-sports.io/flags/kw.svg',
  'bahrain': 'https://media.api-sports.io/flags/bh.svg',

  // Americas
  'usa': 'https://media.api-sports.io/flags/us.svg',
  'brazil': 'https://media.api-sports.io/flags/br.svg',
  'argentina': 'https://media.api-sports.io/flags/ar.svg',
  'mexico': 'https://media.api-sports.io/flags/mx.svg',
  'colombia': 'https://media.api-sports.io/flags/co.svg',
  'chile': 'https://media.api-sports.io/flags/cl.svg',
  'peru': 'https://media.api-sports.io/flags/pe.svg',
  'ecuador': 'https://media.api-sports.io/flags/ec.svg',
  'uruguay': 'https://media.api-sports.io/flags/uy.svg',
  'paraguay': 'https://media.api-sports.io/flags/py.svg',
  'venezuela': 'https://media.api-sports.io/flags/ve.svg',
  'canada': 'https://media.api-sports.io/flags/ca.svg',

  // Africa
  'egypt': 'https://media.api-sports.io/flags/eg.svg',
  'morocco': 'https://media.api-sports.io/flags/ma.svg',
  'nigeria': 'https://media.api-sports.io/flags/ng.svg',
  'south-africa': 'https://media.api-sports.io/flags/za.svg',
  'ghana': 'https://media.api-sports.io/flags/gh.svg',
  'cameroon': 'https://media.api-sports.io/flags/cm.svg',
  'senegal': 'https://media.api-sports.io/flags/sn.svg',
  'tunisia': 'https://media.api-sports.io/flags/tn.svg',
  'algeria': 'https://media.api-sports.io/flags/dz.svg',
  'ethiopia': 'https://media.api-sports.io/flags/et.svg',

  // Others
  'world': null,
  'europe': null,
  'asia': null,
  'africa': null,
};

// Function untuk cek apakah liga internasional dan dapet logonya
function getInternationalLogo(leagueName) {
  if (!leagueName) return null;
  const nameLower = leagueName.toLowerCase().trim();

  // EXCLUDE - Liga domestik yang namanya mirip international
  const DOMESTIC_LEAGUES = [
    'championship',
    'league one',
    'league two',
    'premier league',
    'la liga',
    'serie a',
    'serie b',
    'bundesliga',
    'ligue 1',
    'ligue 2',
    'eredivisie',
    'primeira liga',
    'liga portugal',
    'super lig',
    'a-league',
    'j-league',
    'k league',
    'liga 1',
    'mls',
  ];

  // Cek apakah ini liga domestik - SKIP kalau iya
  for (const domestic of DOMESTIC_LEAGUES) {
    if (nameLower === domestic || nameLower.startsWith(domestic + ' ')) {
      return null;
    }
  }

  // Cek exact match dulu
  if (INTERNATIONAL_LOGOS[nameLower]) {
    return INTERNATIONAL_LOGOS[nameLower];
  }

  // Cek partial match - tapi harus FULL WORD match
  for (const [key, logo] of Object.entries(INTERNATIONAL_LOGOS)) {
    // Hanya match kalau key ada di dalam nama liga sebagai kata lengkap
    const keyWords = key.split(' ');
    const nameWords = nameLower.split(' ');

    // Cek apakah SEMUA kata dari key ada di nama liga
    const allWordsMatch = keyWords.every(kw => nameWords.some(nw => nw.includes(kw)));

    if (allWordsMatch && keyWords.length >= 2) {
      return logo;
    }
  }

  return null;
}

// Function untuk dapet bendera negara
function getCountryFlag(country) {
  if (!country) return null;
  const countryLower = country.toLowerCase().replace(/ /g, '-');
  return COUNTRY_FLAGS[countryLower] || null;
}

export default function SofaMatchList({ matches = [], onMatchClick, selectedMatch }) {
  const [expandedLeagues, setExpandedLeagues] = useState({});
  const [favoriteMatches, setFavoriteMatches] = useState([]);

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('football_favorites');
    if (saved) {
      setFavoriteMatches(JSON.parse(saved));
    }
  }, []);

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

    let newFavorites;
    if (favoriteMatches.includes(matchId)) {
      newFavorites = favoriteMatches.filter(id => id !== matchId);
      console.log('⭐ Removed from favorites:', matchId);
    } else {
      newFavorites = [...favoriteMatches, matchId];
      console.log('⭐ Added to favorites:', matchId);
    }

    setFavoriteMatches(newFavorites);
    localStorage.setItem('football_favorites', JSON.stringify(newFavorites));
    console.log('📦 Saved favorites:', newFavorites);
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
              {/* Logo Tournament Internasional ATAU Bendera Negara */}
              {(() => {
                const internationalLogo = getInternationalLogo(group.league);
                const countryFlag = group.leagueFlag || getCountryFlag(group.country);

                if (internationalLogo) {
                  // Tournament internasional - pake logo khusus
                  return (
                    <img
                      src={internationalLogo}
                      alt={group.league}
                      className="w-5 h-5 object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '';
                        e.target.style.display = 'none';
                      }}
                    />
                  );
                } else if (countryFlag) {
                  // Liga negara - pake bendera dari API atau mapping
                  return (
                    <img
                      src={countryFlag}
                      alt={group.country}
                      className="w-5 h-4 object-cover rounded-sm"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                      }}
                    />
                  );
                } else {
                  // Fallback emoji
                  return <span className="text-lg">🌍</span>;
                }
              })()}
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
