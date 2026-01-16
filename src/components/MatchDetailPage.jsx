// MatchDetailPage.jsx - Tampilan dari PredictionForm + Logic dari Backend Baru
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Star, Tv, Calendar, MapPin, Users, Trophy, TrendingUp, Target, Clock,
    User, Flag, ChevronRight, ChevronLeft, Coins, Gift, Wifi, WifiOff,
    Activity, ArrowLeft
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import dayjs from 'dayjs';
import { useMatchDetail, useConnectionStatus, useStandings, useOdds } from '../hooks/useMatchDetail';
import StreamingPlayer from './StreamingPlayer';
import StatusManager from '../utils/StatusManager';

// ============= TEAM LOGO COMPONENT =============
const SimpleTeamLogo = ({ teamId, teamName, logoUrl, size = 'w-6 h-6' }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [hasError, setHasError] = useState(false);
    const BUNNYCDN_BASE = 'https://api-football-logos.b-cdn.net';

    useEffect(() => {
        if (logoUrl) setImageSrc(logoUrl);
        else if (teamId) setImageSrc(`${BUNNYCDN_BASE}/football/teams/${teamId}.png`);
        setHasError(false);
    }, [logoUrl, teamId]);

    const handleError = () => {
        if (!hasError && teamId) {
            setImageSrc(`https://media.api-sports.io/football/teams/${teamId}.png`);
            setHasError(true);
        }
    };

    if (hasError || !imageSrc) {
        const initials = teamName ? teamName.substring(0, 2).toUpperCase() : 'FC';
        return (
            <div className={`${size} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0`} title={teamName}>
                {initials}
            </div>
        );
    }

    return <img src={imageSrc} alt={`${teamName} logo`} className={`${size} object-cover rounded-full border border-gray-200 flex-shrink-0`} onError={handleError} title={teamName} />;
};

// ============= LEAGUE LOGO COMPONENT =============
const SimpleLeagueLogo = ({ leagueName, leagueId, logoUrl, size = 'w-4 h-4' }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [hasError, setHasError] = useState(false);
    const BUNNYCDN_BASE = 'https://api-football-logos.b-cdn.net';

    useEffect(() => {
        if (logoUrl) setImageSrc(logoUrl);
        else if (leagueId) setImageSrc(`${BUNNYCDN_BASE}/football/leagues/${leagueId}.png`);
        setHasError(false);
    }, [logoUrl, leagueId]);

    if (hasError || !imageSrc) {
        const initials = leagueName ? leagueName.substring(0, 2).toUpperCase() : 'LG';
        return (
            <div className={`${size} bg-gradient-to-br from-green-500 to-blue-600 rounded-sm flex items-center justify-center text-white font-bold text-xs`} title={leagueName}>
                {initials}
            </div>
        );
    }

    return <img src={imageSrc} alt={`${leagueName} logo`} className={`${size} object-cover rounded-sm`} onError={() => setHasError(true)} title={leagueName} />;
};

// ============= MAIN COMPONENT =============
const MatchDetailPage = ({ user, username, match: initialMatch, goBack, onAuthRequired }) => {

    // Handle back with fallback
    const handleGoBack = useCallback(() => {
        if (goBack && typeof goBack === 'function') {
            goBack();
        } else {
            window.location.href = '/';
        }
    }, [goBack]);

    // Backend hook - fetch match detail
    const { match: fetchedMatch, statistics, events, lineups, loading: detailsLoading, lastUpdated } = useMatchDetail(initialMatch?.id, {
        autoFetch: true,
        refreshInterval: 30000,
        includeStats: true,
        includeEvents: true,
        includeLineups: true
    });

    const { connected: isConnected } = useConnectionStatus();
    const liveMatchData = fetchedMatch || initialMatch;

    // Fetch standings/klasemen
    const { standings, loading: standingsLoading } = useStandings(
        liveMatchData?.league_id || initialMatch?.league_id,
        new Date().getFullYear()
    );

    // Fetch odds
    const { odds, loading: oddsLoading } = useOdds(initialMatch?.id);

    // State
    const [activeTab, setActiveTab] = useState('events');
    const [winnerPrediction, setWinnerPrediction] = useState(null);
    const [scorePrediction, setScorePrediction] = useState({ home: '', away: '' });
    const [hasWinnerPrediction, setHasWinnerPrediction] = useState(false);
    const [hasScorePrediction, setHasScorePrediction] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [liveUpdateCount, setLiveUpdateCount] = useState(0);

    useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [initialMatch?.id]);
    useEffect(() => { if (lastUpdated) setLiveUpdateCount(prev => prev + 1); }, [lastUpdated]);

    // ============= MATCH STATUS =============
    const getMatchStatus = useCallback(() => {
        if (!liveMatchData) return { isLive: false, isFinished: false, isHalfTime: false, currentScore: { home: 0, away: 0 } };

        const status = (liveMatchData.status_short || liveMatchData.status || 'NS').toUpperCase();
        const minute = liveMatchData.elapsed || liveMatchData.minute || 0;

        const liveStatuses = ['1H', '2H', 'ET', 'BT', 'P', 'LIVE'];
        const finishedStatuses = ['FT', 'AET', 'PEN'];

        return {
            status,
            minute,
            isLive: liveStatuses.includes(status) || liveMatchData.is_live,
            isFinished: finishedStatuses.includes(status) || liveMatchData.is_finished,
            isHalfTime: status === 'HT',
            currentScore: { home: liveMatchData.home_score ?? 0, away: liveMatchData.away_score ?? 0 }
        };
    }, [liveMatchData]);

    const { status, minute, isLive, isFinished, isHalfTime, currentScore } = getMatchStatus();

    const getTimeDisplay = () => {
        if (isHalfTime) return 'HT';
        if (isFinished) return 'FT';
        if (isLive) return `${minute}'`;

        // Scheduled - show kickoff time
        if (liveMatchData?.date) {
            const date = new Date(liveMatchData.date);
            return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
        }
        return 'TBD';
    };

    const isBigMatch = liveMatchData?.league && ['UEFA Champions League', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Liga 1'].includes(liveMatchData.league);

    // ============= PREDICTIONS =============
    const checkExistingPredictions = useCallback(async () => {
        if (!user || !liveMatchData?.id) return;
        try {
            const matchId = parseInt(liveMatchData.id);
            const [winnerResult, scoreResult] = await Promise.all([
                supabase.from('winner_predictions').select('predicted_result').eq('email', user.email).eq('match_id', matchId),
                supabase.from('score_predictions').select('predicted_home_score, predicted_away_score').eq('email', user.email).eq('match_id', matchId)
            ]);
            if (winnerResult.data?.length > 0) { setHasWinnerPrediction(true); setWinnerPrediction(winnerResult.data[0].predicted_result); }
            if (scoreResult.data?.length > 0) { setHasScorePrediction(true); setScorePrediction({ home: scoreResult.data[0].predicted_home_score.toString(), away: scoreResult.data[0].predicted_away_score.toString() }); }
        } catch (error) { console.log('Error:', error); }
    }, [user, liveMatchData?.id]);

    useEffect(() => { checkExistingPredictions(); }, [checkExistingPredictions]);

    const handleSubmitWinner = async () => {
        if (!user) { alert('Silakan login terlebih dahulu!'); onAuthRequired?.(); return; }
        if (!winnerPrediction || hasWinnerPrediction) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('winner_predictions').insert([{ email: user.email, match_id: parseInt(liveMatchData.id), predicted_result: winnerPrediction, status: 'pending' }]);
            if (error) throw error;
            setHasWinnerPrediction(true);
            alert('🏆 Winner prediction submitted!');
        } catch (error) { alert(`Failed: ${error.message}`); }
        finally { setIsSubmitting(false); }
    };

    const handleSubmitScore = async () => {
        if (!user) { alert('Silakan login terlebih dahulu!'); onAuthRequired?.(); return; }
        if (scorePrediction.home === '' || scorePrediction.away === '' || hasScorePrediction) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('score_predictions').insert([{ email: user.email, match_id: parseInt(liveMatchData.id), predicted_home_score: parseInt(scorePrediction.home), predicted_away_score: parseInt(scorePrediction.away), status: 'pending' }]);
            if (error) throw error;
            setHasScorePrediction(true);
            alert('⚽ Score prediction submitted!');
        } catch (error) { alert(`Failed: ${error.message}`); }
        finally { setIsSubmitting(false); }
    };

    // ============= UI COMPONENTS =============
    const MatchHeader = () => {
        const timeDisplay = getTimeDisplay();

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 relative font-condensed">
                {/* Connection status */}
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex items-center gap-1 sm:gap-2 z-10">
                    {isConnected ? (
                        <div className="flex items-center gap-1">
                            <Wifi className="w-3 h-3 text-green-500" />
                            <span className="text-xs text-green-600 hidden sm:inline">via NobarMeriah</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1">
                            <WifiOff className="w-3 h-3 text-red-500" />
                            <span className="text-xs text-red-600 hidden sm:inline">Offline</span>
                        </div>
                    )}
                </div>

                <div className="px-4 sm:px-6 py-4 sm:py-8">
                    {/* Mobile Layout */}
                    <div className="block sm:hidden">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <SimpleTeamLogo teamId={liveMatchData?.home_team_id} teamName={liveMatchData?.home_team} logoUrl={liveMatchData?.home_team_logo} size="w-8 h-8" />
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-sm font-condensed text-gray-900 leading-tight truncate">{liveMatchData?.home_team}</h2>
                                        <p className="text-xs text-gray-500 font-condensed">Home</p>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center px-3 min-w-[80px]">
                                    {isLive || isFinished || isHalfTime ? (
                                        <>
                                            <motion.div className={`text-xl font-condensed mb-1 ${isLive ? 'text-red-600' : 'text-gray-900'}`} key={`${currentScore.home}-${currentScore.away}`}>
                                                {currentScore.home} - {currentScore.away}
                                            </motion.div>
                                            <div className="flex items-center gap-1">
                                                {isLive && <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>}
                                                <span className={`text-xs font-condensed ${isHalfTime ? 'text-orange-600' : isLive ? 'text-red-600' : 'text-green-600'}`}>{timeDisplay}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-lg font-condensed text-gray-900 mb-1">{timeDisplay}</div>
                                            <span className="text-xs text-gray-500 font-condensed">WIB</span>
                                        </>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                                    <div className="min-w-0 flex-1 text-right">
                                        <h2 className="text-sm font-condensed text-gray-900 leading-tight truncate">{liveMatchData?.away_team}</h2>
                                        <p className="text-xs text-gray-500 font-condensed">Away</p>
                                    </div>
                                    <SimpleTeamLogo teamId={liveMatchData?.away_team_id} teamName={liveMatchData?.away_team} logoUrl={liveMatchData?.away_team_logo} size="w-8 h-8" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                            <SimpleTeamLogo teamId={liveMatchData?.home_team_id} teamName={liveMatchData?.home_team} logoUrl={liveMatchData?.home_team_logo} size="w-12 h-12" />
                            <div className="text-right">
                                <h2 className="text-lg font-condensed text-gray-900 leading-tight">{liveMatchData?.home_team}</h2>
                                <p className="text-sm text-gray-500 font-condensed">Home</p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center px-8 min-w-[140px]">
                            {isLive || isFinished || isHalfTime ? (
                                <>
                                    <motion.div className={`text-3xl font-condensed mb-1 ${isLive ? 'text-red-600' : 'text-gray-900'}`} key={`${currentScore.home}-${currentScore.away}`}>
                                        {currentScore.home} - {currentScore.away}
                                    </motion.div>
                                    <div className="flex items-center gap-1">
                                        {isLive && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>}
                                        <span className={`text-sm font-condensed ${isHalfTime ? 'text-orange-600' : isLive ? 'text-red-600' : 'text-green-600'}`}>{timeDisplay}</span>
                                        {isLive && liveUpdateCount > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-2">{liveUpdateCount} updates</span>}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-2xl font-condensed text-gray-900 mb-1">{timeDisplay}</div>
                                    <span className="text-sm text-gray-500 font-condensed">WIB</span>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-4 flex-1 justify-end">
                            <div className="text-left">
                                <h2 className="text-lg font-condensed text-gray-900 leading-tight">{liveMatchData?.away_team}</h2>
                                <p className="text-sm text-gray-500 font-condensed">Away</p>
                            </div>
                            <SimpleTeamLogo teamId={liveMatchData?.away_team_id} teamName={liveMatchData?.away_team} logoUrl={liveMatchData?.away_team_logo} size="w-12 h-12" />
                        </div>
                    </div>
                </div>

                {/* Bottom Info */}
                <div className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-600 flex-wrap">
                        <div className="flex items-center gap-2">
                            <SimpleLeagueLogo leagueName={liveMatchData?.league} leagueId={liveMatchData?.league_id} size="w-4 h-4" />
                            <span>{liveMatchData?.league || 'Football'}</span>
                        </div>
                        {liveMatchData?.venue && (
                            <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span className="truncate max-w-[150px]">{liveMatchData.venue}</span>
                            </div>
                        )}
                        {isLive && (
                            <div className="flex items-center gap-1 text-red-600">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                                <span className="font-condensed">LIVE</span>
                            </div>
                        )}
                    </div>
                </div>

                {isLive && liveUpdateCount > 0 && (
                    <motion.div className="absolute inset-0 bg-red-500/5 pointer-events-none" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1 }} key={liveUpdateCount} />
                )}
            </div>
        );
    };

    const OddsSection = () => {
        // Get 1X2 odds (Match Winner)
        const matchWinnerOdds = odds?.find(o => o.name === 'Match Winner' || o.id === 1);
        const overUnderOdds = odds?.find(o => o.name === 'Goals Over/Under' || o.id === 5);

        // Extract values
        const homeOdd = matchWinnerOdds?.values?.find(v => v.value === 'Home')?.odd || '-';
        const drawOdd = matchWinnerOdds?.values?.find(v => v.value === 'Draw')?.odd || '-';
        const awayOdd = matchWinnerOdds?.values?.find(v => v.value === 'Away')?.odd || '-';

        // Over/Under 2.5
        const over25 = overUnderOdds?.values?.find(v => v.value === 'Over 2.5')?.odd || '-';
        const under25 = overUnderOdds?.values?.find(v => v.value === 'Under 2.5')?.odd || '-';

        if (oddsLoading) {
            return (
                <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Coins className="w-5 h-5 text-yellow-600" />
                        <h3 className="font-condensed text-gray-900">ODDS</h3>
                    </div>
                    <div className="text-center py-4">
                        <div className="animate-spin w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full mx-auto"></div>
                        <p className="text-xs text-gray-500 mt-2">Loading odds...</p>
                    </div>
                </div>
            );
        }

        if (!odds || odds.length === 0) {
            return (
                <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Coins className="w-5 h-5 text-yellow-600" />
                        <h3 className="font-condensed text-gray-900">ODDS</h3>
                    </div>
                    <div className="text-center py-6">
                        <div className="text-3xl mb-2">📊</div>
                        <p className="text-sm text-gray-600 font-condensed">Odds belum tersedia</p>
                        <p className="text-xs text-gray-400">untuk pertandingan ini</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-4">
                    <Coins className="w-5 h-5 text-yellow-600" />
                    <h3 className="font-condensed text-gray-900">ODDS</h3>
                </div>

                {/* 1X2 Odds */}
                <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2 text-center">Match Winner (1X2)</p>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-500 mb-1">Home</p>
                            <p className="text-lg font-bold text-blue-600">{homeOdd}</p>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-500 mb-1">Draw</p>
                            <p className="text-lg font-bold text-gray-600">{drawOdd}</p>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-500 mb-1">Away</p>
                            <p className="text-lg font-bold text-red-600">{awayOdd}</p>
                        </div>
                    </div>
                </div>

                {/* Over/Under 2.5 */}
                {(over25 !== '-' || under25 !== '-') && (
                    <div>
                        <p className="text-xs text-gray-500 mb-2 text-center">Over/Under 2.5 Goals</p>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                                <p className="text-xs text-gray-500 mb-1">Over 2.5</p>
                                <p className="text-lg font-bold text-green-600">{over25}</p>
                            </div>
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-center">
                                <p className="text-xs text-gray-500 mb-1">Under 2.5</p>
                                <p className="text-lg font-bold text-orange-600">{under25}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bookmaker Info */}
                <p className="text-xs text-gray-400 text-center mt-3">
                    via API-Football
                </p>
            </div>
        );
    };

    // ============= PREDICTION SLIDER STATE =============
    const [predictionSlide, setPredictionSlide] = useState(0);
    const totalSlides = 2; // Slide 0: Winner, Slide 1: Score

    const nextSlide = () => setPredictionSlide((prev) => (prev + 1) % totalSlides);
    const prevSlide = () => setPredictionSlide((prev) => (prev - 1 + totalSlides) % totalSlides);

    const PredictionSection = () => (
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <h3 className="font-condensed text-gray-900">Prediksi</h3>
                </div>
                {isLive && (
                    <div className="flex items-center gap-1 text-xs text-red-600">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span>LIVE</span>
                    </div>
                )}
            </div>

            {!isLive && !isFinished ? (
                <div className="relative min-h-[150px]">
                    {/* Slides Container - Carousel Style */}
                    <div className="min-h-[100px] overflow-hidden">
                        <div
                            className="flex transition-transform duration-300 ease-in-out"
                            style={{ transform: `translateX(-${predictionSlide * 100}%)` }}
                        >
                            {/* Slide 0: Winner Prediction */}
                            <div className="text-center min-w-full flex-shrink-0 px-1">
                                {/* Question */}
                                <div className="mb-4">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-1">Siapa yang akan menang?</h4>
                                    <p className="text-xs text-gray-500">Berikan votingmu!</p>
                                </div>

                                {hasWinnerPrediction ? (
                                    <div className="bg-green-50 border border-green-300 rounded-xl p-4">
                                        <div className="text-3xl mb-2">✅</div>
                                        <h5 className="font-semibold text-green-800 mb-1">Prediksi Terkirim!</h5>
                                        <p className="text-green-700 text-sm">
                                            {winnerPrediction === 'home' ? liveMatchData?.home_team : winnerPrediction === 'away' ? liveMatchData?.away_team : 'Draw'}
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Winner Options - Horizontal */}
                                        <div className="flex items-center justify-center gap-3 mb-4">
                                            {/* Home Team */}
                                            <button
                                                onClick={() => setWinnerPrediction('home')}
                                                className={`flex flex-col items-center p-3 rounded-xl border-2 transition-colors min-w-[80px] ${winnerPrediction === 'home'
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <SimpleTeamLogo
                                                    teamId={liveMatchData?.home_team_id}
                                                    teamName={liveMatchData?.home_team}
                                                    logoUrl={liveMatchData?.home_team_logo}
                                                    size="w-10 h-10"
                                                />
                                                {winnerPrediction === 'home' && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                                )}
                                            </button>

                                            {/* Draw */}
                                            <button
                                                onClick={() => setWinnerPrediction('draw')}
                                                className={`flex flex-col items-center p-3 rounded-xl border-2 transition-colors min-w-[60px] ${winnerPrediction === 'draw'
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-lg">
                                                    X
                                                </div>
                                                {winnerPrediction === 'draw' && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                                )}
                                            </button>

                                            {/* Away Team */}
                                            <button
                                                onClick={() => setWinnerPrediction('away')}
                                                className={`flex flex-col items-center p-3 rounded-xl border-2 transition-colors min-w-[80px] ${winnerPrediction === 'away'
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <SimpleTeamLogo
                                                    teamId={liveMatchData?.away_team_id}
                                                    teamName={liveMatchData?.away_team}
                                                    logoUrl={liveMatchData?.away_team_logo}
                                                    size="w-10 h-10"
                                                />
                                                {winnerPrediction === 'away' && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                                )}
                                            </button>
                                        </div>

                                        {/* Points Badge */}
                                        <div className="flex justify-center mb-2">
                                            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">
                                                +{isBigMatch ? 15 : 10} pts {isBigMatch && '🔥'}
                                            </span>
                                        </div>

                                        {/* Submit Button */}
                                        {winnerPrediction && (
                                            <button
                                                onClick={handleSubmitWinner}
                                                disabled={isSubmitting}
                                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                            >
                                                {isSubmitting ? '⏳ Mengirim...' : '✓ Kirim Prediksi'}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Slide 1: Score Prediction */}
                            <div className="text-center min-w-full flex-shrink-0 px-1">
                                {/* Question */}
                                <div className="mb-4">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-1">Berapa skor akhirnya?</h4>
                                    <p className="text-xs text-gray-500">Tebak skor pertandingan!</p>
                                </div>

                                {hasScorePrediction ? (
                                    <div className="bg-blue-50 border border-blue-300 rounded-xl p-4">
                                        <div className="text-3xl mb-2">⚽</div>
                                        <h5 className="font-semibold text-blue-800 mb-1">Prediksi Terkirim!</h5>
                                        <p className="text-blue-700 text-xl font-bold">{scorePrediction.home} - {scorePrediction.away}</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Score Input */}
                                        <div className="flex items-center justify-center gap-4 mb-4">
                                            {/* Home Score */}
                                            <div className="text-center">
                                                <SimpleTeamLogo
                                                    teamId={liveMatchData?.home_team_id}
                                                    teamName={liveMatchData?.home_team}
                                                    logoUrl={liveMatchData?.home_team_logo}
                                                    size="w-10 h-10"
                                                />
                                                <p className="text-xs text-gray-600 mt-1 truncate max-w-[70px]">{liveMatchData?.home_team}</p>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="20"
                                                    placeholder="0"
                                                    value={scorePrediction.home}
                                                    onChange={(e) => setScorePrediction(prev => ({ ...prev, home: e.target.value }))}
                                                    className={`w-16 text-center p-3 border-2 rounded-xl text-2xl font-bold mt-2 transition-colors ${scorePrediction.home !== ''
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200'
                                                        }`}
                                                />
                                            </div>

                                            {/* Separator */}
                                            <span className="text-3xl text-gray-400 font-bold mt-8">:</span>

                                            {/* Away Score */}
                                            <div className="text-center">
                                                <SimpleTeamLogo
                                                    teamId={liveMatchData?.away_team_id}
                                                    teamName={liveMatchData?.away_team}
                                                    logoUrl={liveMatchData?.away_team_logo}
                                                    size="w-10 h-10"
                                                />
                                                <p className="text-xs text-gray-600 mt-1 truncate max-w-[70px]">{liveMatchData?.away_team}</p>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="20"
                                                    placeholder="0"
                                                    value={scorePrediction.away}
                                                    onChange={(e) => setScorePrediction(prev => ({ ...prev, away: e.target.value }))}
                                                    className={`w-16 text-center p-3 border-2 rounded-xl text-2xl font-bold mt-2 transition-colors ${scorePrediction.away !== ''
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200'
                                                        }`}
                                                />
                                            </div>
                                        </div>

                                        {/* Points Badge */}
                                        <div className="flex justify-center mb-2">
                                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                                                +{isBigMatch ? 25 : 20} pts {isBigMatch && '🔥'}
                                            </span>
                                        </div>

                                        {/* Submit Button */}
                                        {scorePrediction.home !== '' && scorePrediction.away !== '' && (
                                            <button
                                                onClick={handleSubmitScore}
                                                disabled={isSubmitting}
                                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                            >
                                                {isSubmitting ? '⏳ Mengirim...' : '✓ Kirim Prediksi'}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>{/* End flex carousel */}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                        {/* Previous */}
                        <button
                            onClick={prevSlide}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Sebelumnya</span>
                        </button>

                        {/* Dots Indicator */}
                        <div className="flex items-center gap-2">
                            {[0, 1].map((dot) => (
                                <button
                                    key={dot}
                                    onClick={() => setPredictionSlide(dot)}
                                    className={`w-2 h-2 rounded-full transition-all ${predictionSlide === dot
                                        ? 'bg-blue-600 w-4'
                                        : 'bg-gray-300 hover:bg-gray-400'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Next */}
                        <button
                            onClick={nextSlide}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            <span>Berikutnya</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ) : isLive ? (
                <div className="text-center py-6">
                    <div className="text-4xl mb-3">🔴</div>
                    <h4 className="font-semibold text-red-600 mb-2">Pertandingan Berlangsung</h4>
                    <p className="text-sm text-gray-600">Prediksi dikunci saat match live</p>
                </div>
            ) : (
                <div className="text-center py-6">
                    <div className="text-4xl mb-3">🏁</div>
                    <h4 className="font-semibold text-gray-900 mb-2">Pertandingan Selesai</h4>
                    <div className="text-2xl font-bold text-gray-900">{currentScore.home} - {currentScore.away}</div>
                </div>
            )}
        </div>
    );

    const SeasonChallengeSection = () => (
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-4">
                <Gift className="w-5 h-5 text-purple-600" />
                <h3 className="font-condensed text-gray-900">Season Challenge</h3>
            </div>
            <div className="text-center py-4">
                <div className="text-2xl mb-2">🏆</div>
                <p className="text-sm text-gray-600 mb-3 font-condensed">Join the season challenge!</p>
                <button className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-condensed hover:bg-purple-700 transition-colors">View Challenge</button>
            </div>
        </div>
    );

    const InfoDetailSection = () => {
        const kickoffDate = liveMatchData?.date ? dayjs(liveMatchData.date).format('DD MMMM YYYY') : '-';
        const kickoffTime = liveMatchData?.date ? dayjs(liveMatchData.date).format('HH:mm') : '-';

        return (
            <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <h3 className="font-condensed text-gray-900">Info Detail</h3>
                </div>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center"><span className="text-gray-600">Date:</span><span className="font-condensed text-gray-900">{kickoffDate}</span></div>
                    <div className="flex justify-between items-center"><span className="text-gray-600">Kickoff:</span><span className="font-condensed text-gray-900">{kickoffTime} WIB</span></div>
                    <div className="flex justify-between items-center"><span className="text-gray-600">Stadium:</span><span className="font-condensed text-gray-900">{liveMatchData?.venue || 'Unknown Venue'}</span></div>
                    <div className="flex justify-between items-center"><span className="text-gray-600">League:</span><span className="font-condensed text-gray-900">{liveMatchData?.league || '-'}</span></div>
                    {isLive && <div className="flex justify-between items-center"><span className="text-gray-600">Status:</span><span className="font-condensed text-red-600">🔴 Live</span></div>}
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Data Source:</span>
                        <span className={`font-condensed ${isConnected ? 'text-green-600' : 'text-red-600'}`}>{isConnected ? '🟢 via NobarMeriah' : '🔴 Offline'}</span>
                    </div>
                </div>
            </div>
        );
    };

    const AdSection = () => (
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
            <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-lg p-6 text-center text-white">
                <div className="text-2xl mb-2">📺</div>
                <h4 className="font-condensed mb-1">Advertisement</h4>
                <p className="text-xs opacity-90">Your ad could be here</p>
            </div>
        </div>
    );

    const TabNavigation = () => {
        const tabs = [
            { id: 'stream', label: 'Live', icon: Tv },  // NEW: Tab streaming di posisi pertama
            { id: 'events', label: 'Events', icon: Activity },
            { id: 'stats', label: 'Stats', icon: TrendingUp },
            { id: 'lineups', label: 'Lineups', icon: User },
            { id: 'standing', label: 'Klasemen', icon: Trophy }
        ];

        return (
            <div className="bg-white rounded-xl shadow-lg mb-4 overflow-hidden">
                <div className="flex">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isStreamTab = tab.id === 'stream';
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-1 py-3 px-2 text-xs font-condensed transition-all ${activeTab === tab.id
                                    ? isStreamTab
                                        ? 'bg-red-600 text-white'  // Red for stream tab when active
                                        : 'bg-blue-600 text-white'
                                    : isStreamTab
                                        ? 'text-red-600 hover:bg-red-50'  // Red tint for stream tab
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon className="w-3 h-3" />
                                <span className="hidden sm:inline">{tab.label}</span>
                                {isStreamTab && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse ml-1" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    const EventsTab = () => {
        if (!events || events.length === 0) return <div className="text-center py-8"><div className="text-4xl mb-4">⚽</div><p className="text-gray-500">Belum ada events</p></div>;

        const getEventStyle = (type, detail) => {
            if (type === 'Goal') return { bg: 'bg-green-50 border-l-4 border-green-500', icon: '⚽', iconBg: 'bg-green-500' };
            if (type === 'Card' && detail?.includes('Yellow')) return { bg: 'bg-yellow-50 border-l-4 border-yellow-500', icon: '🟨', iconBg: 'bg-yellow-500' };
            if (type === 'Card' && detail?.includes('Red')) return { bg: 'bg-red-50 border-l-4 border-red-500', icon: '🟥', iconBg: 'bg-red-500' };
            if (type === 'subst' || detail?.includes('Substitution')) return { bg: 'bg-blue-50 border-l-4 border-blue-500', icon: '🔄', iconBg: 'bg-blue-500' };
            return { bg: 'bg-gray-50 border-l-4 border-gray-300', icon: '📌', iconBg: 'bg-gray-400' };
        };

        return (
            <div className="space-y-2">
                {events.map((event, idx) => {
                    const style = getEventStyle(event.type, event.detail);
                    return (
                        <div key={idx} className={`flex items-center gap-4 p-4 rounded-lg ${style.bg}`}>
                            <span className="text-sm font-bold text-gray-700 w-12">{event.time}'</span>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">{event.player}</p>
                                <p className="text-xs text-gray-500">{event.team} • {event.detail}</p>
                            </div>
                            <div className={`w-8 h-8 rounded-full ${style.iconBg} flex items-center justify-center`}>
                                <span className="text-sm">{style.icon}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const StatsTab = () => {
        if (!statistics?.mapped) return <div className="text-center py-8"><div className="text-4xl mb-4">📊</div><p className="text-gray-500">Statistik belum tersedia</p></div>;
        const statsToShow = ['Ball Possession', 'Total Shots', 'Shots on Goal', 'Corner Kicks', 'Fouls'];
        return (
            <div className="space-y-4">
                {statsToShow.map((key) => {
                    const stat = statistics.mapped[key]; if (!stat) return null;
                    const homeVal = parseInt(String(stat.home).replace('%', '')) || 0;
                    const awayVal = parseInt(String(stat.away).replace('%', '')) || 0;
                    const total = homeVal + awayVal || 1;
                    return (
                        <div key={key}>
                            <div className="flex justify-between text-sm mb-1"><span className="font-medium">{stat.home}</span><span className="text-gray-500">{key}</span><span className="font-medium">{stat.away}</span></div>
                            <div className="flex h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="bg-blue-500" style={{ width: `${(homeVal / total) * 100}%` }} />
                                <div className="bg-red-500" style={{ width: `${(awayVal / total) * 100}%` }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const LineupsTab = () => {
        if (!lineups || lineups.length < 2) return <div className="text-center py-8"><div className="text-4xl mb-4">👥</div><p className="text-gray-500">Lineup belum tersedia</p></div>;
        return (
            <div className="grid grid-cols-2 gap-4">
                {lineups.map((team, idx) => (
                    <div key={idx}>
                        <h4 className="font-semibold text-center mb-3">{team.team?.name}</h4>
                        <p className="text-xs text-center text-gray-500 mb-2">Formation: {team.formation}</p>
                        <div className="space-y-1">
                            {team.startXI?.map((player, pIdx) => (
                                <div key={pIdx} className="flex items-center gap-2 text-sm p-1 bg-gray-50 rounded">
                                    <span className="w-6 text-center font-bold text-gray-400">{player.player?.number}</span>
                                    <span className="truncate">{player.player?.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const StandingTab = () => {
        if (standingsLoading) {
            return (
                <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading standings...</p>
                </div>
            );
        }

        if (!standings || standings.length === 0) {
            return (
                <div className="text-center py-8">
                    <div className="text-4xl mb-4">🏆</div>
                    <p className="text-gray-500">Klasemen belum tersedia</p>
                </div>
            );
        }

        // Get the first group standings (usually the main league table)
        const leagueStandings = standings[0]?.league?.standings?.[0] || standings;

        return (
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-200 text-gray-500 text-xs">
                            <th className="py-3 px-2 text-left">#</th>
                            <th className="py-3 px-2 text-left">Team</th>
                            <th className="py-3 px-2 text-center">P</th>
                            <th className="py-3 px-2 text-center">W</th>
                            <th className="py-3 px-2 text-center">D</th>
                            <th className="py-3 px-2 text-center">L</th>
                            <th className="py-3 px-2 text-center hidden sm:table-cell">GF</th>
                            <th className="py-3 px-2 text-center hidden sm:table-cell">GA</th>
                            <th className="py-3 px-2 text-center">GD</th>
                            <th className="py-3 px-2 text-center font-bold">Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leagueStandings.map((team, idx) => {
                            const isCurrentTeam =
                                team.team?.name === liveMatchData?.home_team ||
                                team.team?.name === liveMatchData?.away_team ||
                                team.team?.id === liveMatchData?.home_team_id ||
                                team.team?.id === liveMatchData?.away_team_id;

                            return (
                                <tr
                                    key={team.team?.id || idx}
                                    className={`border-b border-gray-100 ${isCurrentTeam ? 'bg-blue-50 font-semibold' : 'hover:bg-gray-50'}`}
                                >
                                    <td className="py-2 px-2">
                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${team.rank <= 4 ? 'bg-green-500 text-white' :
                                            team.rank >= leagueStandings.length - 2 ? 'bg-red-500 text-white' :
                                                'bg-gray-200 text-gray-700'
                                            }`}>
                                            {team.rank}
                                        </span>
                                    </td>
                                    <td className="py-2 px-2">
                                        <div className="flex items-center gap-2">
                                            {team.team?.logo && (
                                                <img
                                                    src={team.team.logo}
                                                    alt={team.team.name}
                                                    className="w-5 h-5 object-contain"
                                                    onError={(e) => e.target.style.display = 'none'}
                                                />
                                            )}
                                            <span className="truncate max-w-[120px] sm:max-w-[180px]">{team.team?.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-2 px-2 text-center">{team.all?.played || 0}</td>
                                    <td className="py-2 px-2 text-center text-green-600">{team.all?.win || 0}</td>
                                    <td className="py-2 px-2 text-center text-gray-500">{team.all?.draw || 0}</td>
                                    <td className="py-2 px-2 text-center text-red-600">{team.all?.lose || 0}</td>
                                    <td className="py-2 px-2 text-center hidden sm:table-cell">{team.all?.goals?.for || 0}</td>
                                    <td className="py-2 px-2 text-center hidden sm:table-cell">{team.all?.goals?.against || 0}</td>
                                    <td className="py-2 px-2 text-center">
                                        <span className={team.goalsDiff > 0 ? 'text-green-600' : team.goalsDiff < 0 ? 'text-red-600' : ''}>
                                            {team.goalsDiff > 0 ? '+' : ''}{team.goalsDiff || 0}
                                        </span>
                                    </td>
                                    <td className="py-2 px-2 text-center font-bold">{team.points || 0}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        <span>Champions League</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        <span>Relegation</span>
                    </div>
                </div>
            </div>
        );
    };

    // Memoize StreamTab to prevent re-render when parent updates
    const streamTabContent = useMemo(() => {
        if (!liveMatchData) return null;
        return (
            <StreamingPlayer
                homeTeam={liveMatchData?.home_team || liveMatchData?.home_team_name}
                awayTeam={liveMatchData?.away_team || liveMatchData?.away_team_name}
                matchDate={liveMatchData?.date}
                matchId={liveMatchData?.id}
                isLive={isLive}
                isFinished={isFinished}
                matchStatus={status}
            />
        );
    }, [
        liveMatchData?.home_team,
        liveMatchData?.home_team_name,
        liveMatchData?.away_team,
        liveMatchData?.away_team_name,
        liveMatchData?.date,
        liveMatchData?.id,
        isLive,
        isFinished,
        status
    ]);

    // ============= MAIN RENDER =============
    if (!liveMatchData) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F7FEE7] to-[#D9F99D] p-2 sm:p-4 overflow-x-hidden">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-7xl mx-auto px-0 sm:px-4 py-2 sm:py-4">

                {/* Back to Matches - Top */}
                <div className="mb-3 relative z-50">
                    <button
                        onClick={handleGoBack}
                        className="px-4 py-2 bg-white text-gray-700 rounded-xl font-condensed hover:bg-gray-100 transition-colors shadow-sm border border-gray-200 flex items-center gap-2 cursor-pointer"
                        style={{ pointerEvents: 'auto' }}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Matches
                    </button>
                </div>

                <MatchHeader />

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-6">
                    {/* Mobile: Tabs + Streaming FIRST, Desktop: Sidebar first */}
                    <div className="lg:col-span-3 order-1 lg:order-2">
                        <TabNavigation />
                        <AnimatePresence mode="wait">
                            <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                                {activeTab === 'stream' ? (
                                    // Stream tab - no white background wrapper (memoized)
                                    streamTabContent
                                ) : (
                                    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                                        {activeTab === 'events' && <EventsTab />}
                                        {activeTab === 'stats' && <StatsTab />}
                                        {activeTab === 'lineups' && <LineupsTab />}
                                        {activeTab === 'standing' && <StandingTab />}
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Sidebar - Mobile: AFTER streaming, Desktop: LEFT side */}
                    <div className="lg:col-span-1 order-2 lg:order-1">
                        <OddsSection />
                        <PredictionSection />
                        <SeasonChallengeSection />
                        <InfoDetailSection />
                        <AdSection />
                    </div>
                </div>

                {/* Loading indicator */}
                {detailsLoading && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                        <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        <span className="text-sm">Loading match details...</span>
                    </div>
                )}

                {/* Back to Matches - Bottom */}
                <div className="mt-6 relative z-50">
                    <button
                        onClick={handleGoBack}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-condensed hover:bg-gray-300 transition-colors cursor-pointer"
                        style={{ pointerEvents: 'auto' }}
                    >
                        ← Back to Matches
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default MatchDetailPage;
