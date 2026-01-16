import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Star, Calendar, MapPin, Users, Trophy, TrendingUp, Target, Clock,
    User, Flag, ChevronRight, ChevronLeft, Coins, Gift, Wifi, WifiOff,
    Activity
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import dayjs from 'dayjs';
// REPLACE THIS IMPORT
// import { useEnhancedMatchDetails, useEnhancedConnectionStatus } from '../hooks/useEnhancedLivescore';
import GoalNotificationPortal from './GoalNotificationPortal';
import StatusManager from '../utils/StatusManager';

const getEnhancedStatusDisplay = (match) => {
    if (match.phase_info || match.status_color || match.display_text) {
        return {
            text: match.display_text || match.status,
            subText: match.contextual_info || '',
            color: match.status_color === 'red' ? 'text-red-600' :
                match.status_color === 'orange' ? 'text-orange-600' :
                    match.status_color === 'green' ? 'text-green-600' :
                        match.status_color === 'blue' ? 'text-blue-600' : 'text-gray-600',
            icon: match.status_icon || '',
            isCritical: match.is_critical_moment || false,
            isApproaching: match.approaching_break || match.approaching_end || false,
            remainingTime: match.estimated_remaining,
            phaseInfo: match.phase_info
        };
    }
    return null;
};

// ============= SIMPLE TEAM LOGO COMPONENT =============
const SimpleTeamLogo = ({ teamId, teamName, logoUrl, size = 'w-6 h-6' }) => {
    const [imageSrc, setImageSrc] = useState(logoUrl);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setImageSrc(logoUrl);
        setHasError(false);
    }, [logoUrl]);

    const handleError = () => {
        setHasError(true);
    };

    if (hasError || !imageSrc) {
        const initials = teamName ? teamName.substring(0, 2).toUpperCase() : 'FC';
        return (
            <div
                className={`${size} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}
                title={teamName}
            >
                {initials}
            </div>
        );
    }

    return (
        <img
            src={imageSrc}
            alt={`${teamName} logo`}
            className={`${size} object-cover rounded-full border border-gray-200 flex-shrink-0`}
            onError={handleError}
            title={teamName}
        />
    );
};

const SimpleLeagueLogo = ({ leagueName, leagueId, logoUrl, size = 'w-4 h-4' }) => {
    const [imageSrc, setImageSrc] = useState(logoUrl);
    const [hasError, setHasError] = useState(false);

    const getLeagueLogo = (leagueName, leagueId) => {
        const BUNNYCDN_BASE = 'https://api-football-logos.b-cdn.net';

        if (leagueId) {
            return `${BUNNYCDN_BASE}/football/leagues/${leagueId}.png`;
        }

        const leagueLogos = {
            'Premier League': `${BUNNYCDN_BASE}/football/leagues/39.png`,
            'La Liga': `${BUNNYCDN_BASE}/football/leagues/140.png`,
            'Bundesliga': `${BUNNYCDN_BASE}/football/leagues/78.png`,
            'Serie A': `${BUNNYCDN_BASE}/football/leagues/135.png`,
            'Ligue 1': `${BUNNYCDN_BASE}/football/leagues/61.png`,
            'Eredivisie': `${BUNNYCDN_BASE}/football/leagues/88.png`,
            'Liga 1': `${BUNNYCDN_BASE}/football/leagues/274.png`,
            'UEFA Champions League': `${BUNNYCDN_BASE}/football/leagues/2.png`,
            'UEFA Europa League': `${BUNNYCDN_BASE}/football/leagues/3.png`,
            'UEFA Europa Conference League': `${BUNNYCDN_BASE}/football/leagues/848.png`
        };

        return leagueLogos[leagueName] || null;
    };

    useEffect(() => {
        const logoUrl = getLeagueLogo(leagueName, leagueId);
        setImageSrc(logoUrl);
        setHasError(false);
    }, [leagueName, leagueId]);

    const handleError = () => {
        setHasError(true);
    };

    if (hasError || !imageSrc) {
        const leagueFlags = {
            'Premier League': 'https://media.api-sports.io/flags/gb.svg',
            'La Liga': 'https://media.api-sports.io/flags/es.svg',
            'Bundesliga': 'https://media.api-sports.io/flags/de.svg',
            'Serie A': 'https://media.api-sports.io/flags/it.svg',
            'Ligue 1': 'https://media.api-sports.io/flags/fr.svg',
            'UEFA Champions League': 'https://media.api-sports.io/flags/eu.svg',
            'UEFA Europa League': 'https://media.api-sports.io/flags/eu.svg',
            'UEFA Europa Conference League': 'https://media.api-sports.io/flags/eu.svg'
        };

        const flagUrl = leagueFlags[leagueName];

        if (flagUrl) {
            return (
                <img
                    src={flagUrl}
                    alt={leagueName}
                    className={`${size} rounded-sm object-cover`}
                    title={leagueName}
                />
            );
        }

        const initials = leagueName ? leagueName.substring(0, 2).toUpperCase() : 'LG';
        return (
            <div
                className={`${size} bg-gradient-to-br from-green-500 to-blue-600 rounded-sm flex items-center justify-center text-white font-bold text-xs`}
                title={leagueName}
            >
                {initials}
            </div>
        );
    }

    return (
        <img
            src={imageSrc}
            alt={`${leagueName} logo`}
            className={`${size} object-cover rounded-sm`}
            onError={handleError}
            title={leagueName}
        />
    );
};

const ImprovedMatchLayout = ({ user, username, match, goBack, onAuthRequired, isWatchMode }) => {

    // ============= STATE MANAGEMENT =============
    const [activeTab, setActiveTab] = useState('events');
    const [winnerPrediction, setWinnerPrediction] = useState(null);
    const [scorePrediction, setScorePrediction] = useState({ home: '', away: '' });
    const [existingPrediction, setExistingPrediction] = useState(null);
    const [hasWinnerPrediction, setHasWinnerPrediction] = useState(false);
    const [hasScorePrediction, setHasScorePrediction] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentPredictionSlide, setCurrentPredictionSlide] = useState(0);

    // ENHANCED BACKEND INTEGRATION - REPLACE MANUAL STATE WITH HOOKS
    const {
        matchData,
        statistics,
        events,
        lineups,
        loading: detailsLoading,
        error: detailsError,
        lastUpdate
    } = useEnhancedMatchDetails(match.id);

    // const {
    //     connected: isConnected,
    //     lastCheck: connectionLastCheck
    // } = useEnhancedConnectionStatus();

    // Use enhanced match data or fallback to prop
    const liveMatchData = matchData || match;
    const [liveUpdateCount, setLiveUpdateCount] = useState(0);

    const [goalNotification, setGoalNotification] = useState({
        show: false,
        homeTeam: '',
        awayTeam: '',
        scorer: '',
        minute: '',
        homeScore: 0,
        awayScore: 0,
        teamSide: ''
    });

    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    }, []);

    useEffect(() => {
        if (match?.id) {
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: 'smooth'
            });
        }
    }, [match?.id]);

    // Track when match data updates for live update counter
    useEffect(() => {
        if (lastUpdate) {
            setLiveUpdateCount(prev => prev + 1);
        }
    }, [lastUpdate]);

    // ============= ENHANCED MATCH STATUS DETECTION =============
    const getMatchStatus = () => {
        const currentScore = {
            home: liveMatchData.home_score ?? 0,
            away: liveMatchData.away_score ?? 0
        };

        const status = liveMatchData.status?.toLowerCase() || 'upcoming';
        const statusIndonesian = liveMatchData.status_indonesian?.toLowerCase() || '';
        const minute = liveMatchData.minute ?? liveMatchData.elapsed ?? 0;

        // ENHANCED HT DETECTION
        const isHalfTime = (
            status === 'ht' ||
            status === 'halftime' ||
            status.includes('half') ||
            status.toLowerCase().includes('istirahat') ||
            statusIndonesian.includes('istirahat') ||
            statusIndonesian.includes('half') ||
            statusIndonesian.includes('ht')
        );

        console.log('[DEBUG] Half Time Detection:', {
            status,
            statusIndonesian,
            isHalfTime,
            includes_istirahat: statusIndonesian.includes('istirahat')
        });

        // ENHANCED LIVE DETECTION
        const isLive = liveMatchData.is_live ||
            (['live', '1h', '2h'].includes(status) ||
                statusIndonesian.includes('babak pertama') ||
                statusIndonesian.includes('babak kedua')) &&
            !isFinished;

        // ENHANCED FINISHED DETECTION  
        const statusText = (statusIndonesian || status || '').toLowerCase();
        const isFinished = liveMatchData.is_finished ||
            statusText === 'ft' ||
            statusText.includes('selesai') ||
            statusText.includes('finished') ||
            statusText.includes('full time') ||
            statusText === 'aet' ||
            statusText === 'pen' ||
            statusText.includes('berakhir');

        console.log('Enhanced Match Status Debug:', {
            status,
            statusIndonesian,
            minute,
            isHalfTime,
            isLive,
            isFinished,
            is_live_field: liveMatchData.is_live
        });

        return {
            currentScore,
            status,
            statusIndonesian,
            minute,
            isLive,
            isFinished,
            isHalfTime
        };
    };

    const getMatchTimeDisplay = () => {
        const statusInfo = StatusManager.getDisplayInfo(liveMatchData);

        // Untuk penalty, tampilkan PEN
        if ((liveMatchData.pen_home_goals > 0 || liveMatchData.pen_away_goals > 0) && isFinished) {
            return 'PEN';
        }

        return statusInfo.subText || statusInfo.text;
    };

    const { currentScore, status, isLive, isFinished, statusIndonesian } = getMatchStatus();

    const getCountryInfo = (league, matchData) => {
        // Prioritas: ambil dari match data API dulu
        if (matchData?.country && matchData.country !== 'Unknown') {
            return {
                country: matchData.country,
                flag: matchData.country_flag || '',
                code: matchData.country_code || ''
            };
        }

        // Fallback ke hardcoded mapping
        const countryMap = {
            'Premier League': {
                country: 'England',
                flag: 'https://media.api-sports.io/flags/gb.svg',
                code: 'GB'
            },
            'La Liga': {
                country: 'Spain',
                flag: 'https://media.api-sports.io/flags/es.svg',
                code: 'ES'
            },
            // ... copy semua mapping yang lama
        };

        return countryMap[league] || {
            country: 'Unknown Country',
            flag: '',
            code: ''
        };
    };

    // ============= PREDICTION LOGIC (KEEP EXISTING) =============
    const checkExistingPredictions = async () => {
        if (!user || !liveMatchData) return;

        const matchId = parseInt(liveMatchData.id); // Force integer
        if (!matchId) return;

        try {
            const [winnerResult, scoreResult] = await Promise.all([
                supabase
                    .from('winner_predictions')
                    .select('predicted_result')
                    .eq('email', user.email)
                    .eq('match_id', matchId), // Remove parseInt here since already converted above
                supabase
                    .from('score_predictions')
                    .select('predicted_home_score, predicted_away_score')
                    .eq('email', user.email)
                    .eq('match_id', matchId) // Remove parseInt here too
            ]);

            // Rest of function remains same...
        } catch (error) {
            console.log('No existing predictions found');
        }
    };

    const handleSubmitPredictions = async () => {
        const canSubmitWinner = winnerPrediction && !hasWinnerPrediction;
        const canSubmitScore = (scorePrediction.home !== '' && scorePrediction.away !== '') && !hasScorePrediction;

        if (!canSubmitWinner && !canSubmitScore) {
            alert('No new predictions to submit!');
            return;
        }

        setIsSubmitting(true);

        try {
            const promises = [];
            const matchId = parseInt(liveMatchData.id);

            if (canSubmitWinner) {
                promises.push(
                    supabase.from('winner_predictions').insert([{
                        email: user.email,
                        match_id: matchId, // Already integer
                        predicted_result: winnerPrediction,
                        status: 'pending'
                    }])
                );
            }

            if (canSubmitScore) {
                promises.push(
                    supabase.from('score_predictions').insert([{
                        email: user.email,
                        match_id: matchId, // Already integer
                        predicted_home_score: parseInt(scorePrediction.home),
                        predicted_away_score: parseInt(scorePrediction.away),
                        status: 'pending'
                    }])
                );
            }

            await Promise.all(promises);

            if (canSubmitWinner) setHasWinnerPrediction(true);
            if (canSubmitScore) setHasScorePrediction(true);

            alert('🎯 Prediction submitted successfully!');
            await checkExistingPredictions();

        } catch (error) {
            console.error('Error submitting predictions:', error);
            alert(`Failed to submit: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        checkExistingPredictions();
    }, [liveMatchData?.id, user]);

    // ============= UPDATED MATCH HEADER COMPONENT =============
    const MatchHeader = () => {
        const { currentScore, status, statusIndonesian, minute, isLive, isFinished, isHalfTime } = getMatchStatus();
        const timeDisplay = getMatchTimeDisplay();

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 relative font-condensed">
                {liveMatchData.is_critical_moment && (
                    <div className="absolute top-0 left-0 right-0 bg-red-600 text-white px-4 py-1 text-center text-sm font-bold animate-pulse z-20">
                        ⚡ CRITICAL MOMENT ⚡
                    </div>
                )}
                {/* Connection status indicator */}
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
                                {/* Home Team */}
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <SimpleTeamLogo
                                        teamId={liveMatchData.home_team_id}
                                        teamName={liveMatchData.home_team}
                                        logoUrl={liveMatchData.home_team_logo}
                                        size="w-8 h-8"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-sm font-condensed text-gray-900 leading-tight truncate">
                                            {liveMatchData.home_team}
                                        </h2>
                                        <p className="text-xs text-gray-500 font-condensed">Home</p>
                                    </div>
                                </div>

                                {/* Score/Time Display */}
                                <div className="flex flex-col items-center px-3 min-w-[80px]">
                                    {isLive || isFinished || isHalfTime ? (
                                        <>
                                            <motion.div
                                                className={`text-xl font-condensed mb-1 transition-all duration-500 ${isLive ? 'text-red-600' : 'text-gray-900'}`}
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ duration: 0.3 }}
                                                key={`${currentScore.home}-${currentScore.away}`}
                                            >
                                                {currentScore.home} - {currentScore.away}
                                                {/* Penalty display */}
                                                {((liveMatchData.pen_home_goals ?? 0) > 0 || (liveMatchData.pen_away_goals ?? 0) > 0) && (
                                                    <div className="text-sm text-purple-600 mt-1">
                                                        ({liveMatchData.pen_home_goals ?? 0}) - ({liveMatchData.pen_away_goals ?? 0})
                                                    </div>
                                                )}
                                            </motion.div>

                                            <motion.div
                                                className="flex items-center gap-1"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 }}
                                            >
                                                {isLive && (
                                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                                                )}
                                                <span className={`text-xs font-condensed ${isHalfTime ? 'text-orange-600' :
                                                    isLive ? 'text-red-600' :
                                                        isFinished ? 'text-green-600' : 'text-gray-600'
                                                    }`}>
                                                    {timeDisplay}
                                                </span>
                                            </motion.div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-lg font-condensed text-gray-900 mb-1">
                                                {liveMatchData.local_time || dayjs(liveMatchData.kickoff || liveMatchData.kick_off).format('HH.mm')}
                                            </div>
                                            <span className="text-xs text-gray-500 font-condensed">
                                                {liveMatchData.local_date || dayjs(liveMatchData.kickoff || liveMatchData.kick_off).format('DD MMM')}
                                            </span>
                                        </>
                                    )}
                                </div>

                                {/* Away Team */}
                                <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                                    <div className="min-w-0 flex-1 text-right">
                                        <h2 className="text-sm font-condensed text-gray-900 leading-tight truncate">
                                            {liveMatchData.away_team}
                                        </h2>
                                        <p className="text-xs text-gray-500 font-condensed">Away</p>
                                    </div>
                                    <SimpleTeamLogo
                                        teamId={liveMatchData.away_team_id}
                                        teamName={liveMatchData.away_team}
                                        logoUrl={liveMatchData.away_team_logo}
                                        size="w-8 h-8"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:flex items-center justify-between">
                        {/* Home Team */}
                        <div className="flex items-center gap-4 flex-1">
                            <SimpleTeamLogo
                                teamId={liveMatchData.home_team_id}
                                teamName={liveMatchData.home_team}
                                logoUrl={liveMatchData.home_team_logo}
                                size="w-12 h-12"
                            />
                            <div className="text-right">
                                <h2 className="text-lg font-condensed text-gray-900 leading-tight">
                                    {liveMatchData.home_team}
                                </h2>
                                <p className="text-sm text-gray-500 font-condensed">Home</p>
                            </div>
                        </div>

                        {/* Score/Time Display */}
                        <div className="flex flex-col items-center px-8 min-w-[140px]">
                            {isLive || isFinished || isHalfTime ? (
                                <>
                                    <motion.div
                                        className={`text-3xl font-condensed mb-1 transition-all duration-500 ${isLive ? 'text-red-600' : 'text-gray-900'}`}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                        key={`${currentScore.home}-${currentScore.away}`}
                                    >
                                        {currentScore.home} - {currentScore.away}
                                        {/* Penalty display */}
                                        {((liveMatchData.pen_home_goals ?? 0) > 0 || (liveMatchData.pen_away_goals ?? 0) > 0) && (
                                            <div className="text-lg text-purple-600 mt-1">
                                                ({liveMatchData.pen_home_goals ?? 0}) - ({liveMatchData.pen_away_goals ?? 0})
                                            </div>
                                        )}
                                    </motion.div>

                                    <motion.div
                                        className="flex items-center gap-2"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        {isLive && (
                                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                        )}
                                        <span className={`text-sm font-condensed ${isHalfTime ? 'text-orange-600' :
                                            isLive ? 'text-red-600' :
                                                isFinished ? 'text-green-600' : 'text-gray-600'
                                            }`}>
                                            {timeDisplay}
                                            {isHalfTime && <span className="ml-1">Half Time</span>}
                                        </span>
                                        {liveUpdateCount > 0 && isLive && (
                                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-2">
                                                {liveUpdateCount} updates
                                            </span>
                                        )}
                                    </motion.div>
                                </>
                            ) : (
                                <>
                                    <div className="text-2xl font-condensed text-gray-900 mb-1">
                                        {liveMatchData.local_time || dayjs(liveMatchData.kickoff || liveMatchData.kick_off).format('HH.mm')}
                                    </div>
                                    <span className="text-sm text-gray-500 font-condensed">
                                        {liveMatchData.local_date || dayjs(liveMatchData.kickoff || liveMatchData.kick_off).format('DD MMM')}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Away Team */}
                        <div className="flex items-center gap-4 flex-1 justify-end">
                            <div className="text-left">
                                <h2 className="text-lg font-condensed text-gray-900 leading-tight">
                                    {liveMatchData.away_team}
                                </h2>
                                <p className="text-sm text-gray-500 font-condensed">Away</p>
                            </div>
                            <SimpleTeamLogo
                                teamId={liveMatchData.away_team_id}
                                teamName={liveMatchData.away_team}
                                logoUrl={liveMatchData.away_team_logo}
                                size="w-12 h-12"
                            />
                        </div>
                    </div>
                </div>

                {/* Bottom info section */}
                <div className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-50 border-t border-gray-100">
                    {/* Mobile info */}
                    <div className="block sm:hidden space-y-2">
                        <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{liveMatchData.kickoff_date || dayjs(liveMatchData.kickoff || liveMatchData.kick_off).format('DD/MM/YY')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{liveMatchData.kickoff_time || dayjs(liveMatchData.kickoff || liveMatchData.kick_off).format('HH:mm')}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                                <SimpleLeagueLogo
                                    leagueName={liveMatchData.league}
                                    leagueId={liveMatchData.league_id}
                                    size="w-3 h-3"
                                />
                                <span className="truncate max-w-[100px]">{liveMatchData.league || 'Football'}</span>
                            </div>
                            {liveMatchData.venue && (
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate max-w-[80px]">{liveMatchData.venue}</span>
                                </div>
                            )}
                        </div>

                        {(isLive || isHalfTime) && (
                            <div className="flex items-center justify-center gap-1 text-red-600">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></div>
                                <span className="text-xs font-condensed">
                                    {isHalfTime ? 'HALF TIME' : 'LIVE'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Desktop info */}
                    <div className="hidden sm:flex items-center justify-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                                {liveMatchData.kickoff_datetime || dayjs(liveMatchData.kickoff || liveMatchData.kick_off).format('DD/MM/YYYY • HH.mm')}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <SimpleLeagueLogo
                                leagueName={liveMatchData.league}
                                leagueId={liveMatchData.league_id}
                                size="w-4 h-4"
                            />
                            <span>{liveMatchData.league || 'Football League'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{liveMatchData.venue || 'Stadium'}</span>
                        </div>

                        {(isLive || isHalfTime) && (
                            <div className="flex items-center gap-2 text-red-600">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                                <span className="font-condensed">
                                    {isHalfTime ? 'HALF TIME' : 'LIVE'}
                                </span>
                            </div>
                        )}

                        {/* Enhanced connection info */}
                        {lastUpdate && (
                            <div className="flex items-center gap-2 text-green-600">
                                <span className="text-xs">Last update: {lastUpdate.toLocaleTimeString()}</span>
                            </div>
                        )}
                    </div>

                    {/* Connection lost warning */}
                    {isLive && !isConnected && (
                        <motion.div
                            className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                        >
                            <div className="flex items-center gap-1 sm:gap-2 text-xs text-yellow-700">
                                <WifiOff className="w-3 h-3" />
                                <span>Connection lost - reconnecting to via NobarMeriah...</span>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Live update flash effect */}
                {isLive && liveUpdateCount > 0 && (
                    <motion.div
                        className="absolute inset-0 bg-red-500/5 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1 }}
                        key={liveUpdateCount}
                    />
                )}
            </div>
        );
    };

    // Left Sidebar Components (keep existing)
    const OddsSection = () => (
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-4">
                <Coins className="w-5 h-5 text-yellow-600" />
                <h3 className="font-condensed text-gray-900">ODDS</h3>
            </div>
            <div className="text-center py-8">
                <div className="text-3xl mb-2">📊</div>
                <p className="text-sm text-gray-600 font-condensed">Odds detection</p>
                <p className="text-xs text-gray-500 font-condensed">Coming soon</p>
            </div>
        </div>
    );

    const PredictionSection = () => {
        const isBigMatch = liveMatchData.league &&
            ['UEFA Champions League', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga'].includes(liveMatchData.league);

        const canSubmitWinner = useCallback(() => winnerPrediction && !hasWinnerPrediction, [winnerPrediction, hasWinnerPrediction]);
        const canSubmitScore = useCallback(() => (scorePrediction.home !== '' && scorePrediction.away !== '') && !hasScorePrediction, [scorePrediction, hasScorePrediction]);

        const handleHomeScoreChange = useCallback((e) => {
            const value = e.target.value;
            if (value === '' || (!isNaN(value) && parseInt(value) >= 0 && parseInt(value) <= 20)) {
                setScorePrediction(prev => ({ ...prev, home: value }));
            }
        }, []);

        const handleAwayScoreChange = useCallback((e) => {
            const value = e.target.value;
            if (value === '' || (!isNaN(value) && parseInt(value) >= 0 && parseInt(value) <= 20)) {
                setScorePrediction(prev => ({ ...prev, away: value }));
            }
        }, []);

        const handleSubmitWinner = async () => {
            if (!user) {
                alert('Silakan login terlebih dahulu untuk submit prediksi!');
                return;
            }

            if (!canSubmitWinner()) return;

            setIsSubmitting(true);
            try {
                const matchId = parseInt(liveMatchData.id);
                await supabase.from('winner_predictions').insert([{
                    email: user.email,
                    match_id: parseInt(matchId),
                    predicted_result: winnerPrediction,
                    status: 'pending'
                }]);

                setHasWinnerPrediction(true);
                alert('Winner prediction submitted successfully!');
                await checkExistingPredictions();
            } catch (error) {
                console.error('Error submitting winner prediction:', error);
                alert(`Failed to submit: ${error.message}`);
            } finally {
                setIsSubmitting(false);
            }
        };

        const handleSubmitScore = async () => {
            if (!user) {
                alert('Kamu perlu login untuk menyimpan prediksi skor!');
                return;
            }

            if (!canSubmitScore()) return;

            setIsSubmitting(true);
            try {
                const matchId = liveMatchData.match_number || liveMatchData.id;
                await supabase.from('score_predictions').insert([{
                    email: user.email,
                    match_id: parseInt(matchId),
                    predicted_home_score: parseInt(scorePrediction.home),
                    predicted_away_score: parseInt(scorePrediction.away),
                    status: 'pending'
                }]);

                setHasScorePrediction(true);
                alert('Score prediction submitted successfully!');
                await checkExistingPredictions();
            } catch (error) {
                console.error('Error submitting score prediction:', error);
                alert(`Failed to submit: ${error.message}`);
            } finally {
                setIsSubmitting(false);
            }
        };

        const cancelWinnerPrediction = useCallback(() => {
            setWinnerPrediction(null);
        }, []);

        const cancelScorePrediction = useCallback(() => {
            setScorePrediction({ home: '', away: '' });
        }, []);

        return (
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 mb-4">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        <h3 className="text-sm sm:text-base font-condensed text-gray-900">Prediksi</h3>
                    </div>

                    {isLive && (
                        <div className="flex items-center gap-0.5 sm:gap-1 text-xs text-red-600">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-xs">LIVE</span>
                        </div>
                    )}
                </div>

                {!isLive && !isFinished && (
                    <div className="space-y-4 sm:space-y-6">
                        {/* Winner Prediction Section */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-lg">🏆</span>
                                <h4 className="font-condensed text-gray-900">Winner Prediction</h4>
                                <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs">
                                    +{isBigMatch ? 10 : 1} pts
                                    {isBigMatch && <span className="ml-1">🔥</span>}
                                </span>
                            </div>

                            {hasWinnerPrediction ? (
                                <div className="bg-green-50 border border-green-300 rounded-lg p-4 text-center">
                                    <div className="text-2xl mb-2">✅</div>
                                    <h5 className="font-condensed text-green-800 mb-1">Winner Prediction Submitted</h5>
                                    <div className="bg-green-100 rounded px-3 py-1 inline-block">
                                        <span className="text-green-700 font-condensed text-sm">🏆 Your pick submitted</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex flex-col xs:flex-row gap-2 justify-center">
                                        <button
                                            onClick={() => setWinnerPrediction('home')}
                                            className={`flex-1 max-w-none xs:max-w-[100px] sm:max-w-[120px] p-3 rounded-lg border-2 transition-all duration-200 ${winnerPrediction === 'home'
                                                ? 'border-green-500 bg-green-50 shadow-lg transform scale-105'
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                                }`}
                                            disabled={isLive || isFinished}
                                            type="button"
                                        >
                                            <div className="flex xs:flex-col items-center gap-2">
                                                <SimpleTeamLogo
                                                    teamId={liveMatchData.home_team_id}
                                                    teamName={liveMatchData.home_team}
                                                    logoUrl={liveMatchData.home_team_logo}
                                                    size="w-6 h-6 xs:w-7 xs:h-7"
                                                />
                                                <span className="text-xs font-condensed text-gray-700 truncate flex-1 xs:flex-none xs:text-center">
                                                    {liveMatchData.home_team}
                                                </span>
                                                {winnerPrediction === 'home' && (
                                                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                                )}
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setWinnerPrediction('draw')}
                                            className={`flex-1 max-w-none xs:max-w-[100px] sm:max-w-[120px] p-3 rounded-lg border-2 transition-all duration-200 ${winnerPrediction === 'draw'
                                                ? 'border-yellow-500 bg-yellow-50 shadow-lg transform scale-105'
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                                }`}
                                            disabled={isLive || isFinished}
                                            type="button"
                                        >
                                            <div className="flex xs:flex-col items-center gap-2">
                                                <div className="w-6 h-6 xs:w-7 xs:h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-sm font-condensed text-gray-600">X</span>
                                                </div>
                                                <span className="text-xs font-condensed text-gray-700 flex-1 xs:flex-none">Draw</span>
                                                {winnerPrediction === 'draw' && (
                                                    <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                                                )}
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setWinnerPrediction('away')}
                                            className={`flex-1 max-w-none xs:max-w-[100px] sm:max-w-[120px] p-3 rounded-lg border-2 transition-all duration-200 ${winnerPrediction === 'away'
                                                ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105'
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                                }`}
                                            disabled={isLive || isFinished}
                                            type="button"
                                        >
                                            <div className="flex xs:flex-col items-center gap-2">
                                                <SimpleTeamLogo
                                                    teamId={liveMatchData.away_team_id}
                                                    teamName={liveMatchData.away_team}
                                                    logoUrl={liveMatchData.away_team_logo}
                                                    size="w-6 h-6 xs:w-7 xs:h-7"
                                                />
                                                <span className="text-xs font-condensed text-gray-700 truncate flex-1 xs:flex-none xs:text-center">
                                                    {liveMatchData.away_team}
                                                </span>
                                                {winnerPrediction === 'away' && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                                )}
                                            </div>
                                        </button>
                                    </div>

                                    {winnerPrediction && (
                                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                                            <div className="inline-flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-full border border-green-200">
                                                <span className="text-green-600 text-xs font-condensed">
                                                    ✅ Prediksi: {
                                                        winnerPrediction === 'home' ? liveMatchData.home_team :
                                                            winnerPrediction === 'away' ? liveMatchData.away_team : 'Draw'
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleSubmitWinner}
                                                    disabled={isSubmitting}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-condensed hover:bg-green-700 transition-colors disabled:opacity-50"
                                                    type="button"
                                                >
                                                    {isSubmitting ? '...' : '🏆 Submit Winner'}
                                                </button>
                                                <button
                                                    onClick={cancelWinnerPrediction}
                                                    className="px-3 py-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                    type="button"
                                                >
                                                    ❌ Clear
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Score Prediction Section */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-lg">⚽</span>
                                <h4 className="font-condensed text-gray-900">Score Prediction</h4>
                                <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs">
                                    +{isBigMatch ? 20 : 5} pts
                                    {isBigMatch && <span className="ml-1">🔥</span>}
                                </span>
                            </div>

                            {hasScorePrediction ? (
                                <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 text-center">
                                    <div className="text-2xl mb-2">⚽</div>
                                    <h5 className="font-condensed text-blue-800 mb-1">Score Prediction Submitted</h5>
                                    <div className="bg-blue-100 rounded px-3 py-1 inline-block">
                                        <span className="text-blue-700 font-condensed text-sm">⚽ Your score submitted</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex gap-2 justify-center items-center">
                                        <div className="text-center">
                                            <SimpleTeamLogo
                                                teamId={liveMatchData.home_team_id}
                                                teamName={liveMatchData.home_team}
                                                logoUrl={liveMatchData.home_team_logo}
                                                size="w-7 h-7"
                                            />
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                placeholder="0"
                                                value={scorePrediction.home}
                                                onChange={handleHomeScoreChange}
                                                className={`w-14 text-center p-2 border-2 rounded-lg text-lg font-condensed focus:outline-none transition-colors duration-200 mt-2 ${scorePrediction.home !== ''
                                                    ? 'border-green-500 bg-green-50'
                                                    : 'border-gray-300 hover:border-gray-400 focus:border-indigo-500'
                                                    }`}
                                                disabled={isLive || isFinished}
                                                onFocus={(e) => e.target.select()}
                                            />
                                        </div>

                                        <span className="text-2xl text-gray-600 mt-8 px-2">:</span>

                                        <div className="text-center">
                                            <SimpleTeamLogo
                                                teamId={liveMatchData.away_team_id}
                                                teamName={liveMatchData.away_team}
                                                logoUrl={liveMatchData.away_team_logo}
                                                size="w-7 h-7"
                                            />
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                placeholder="0"
                                                value={scorePrediction.away}
                                                onChange={handleAwayScoreChange}
                                                className={`w-14 text-center p-2 border-2 rounded-lg text-lg font-condensed focus:outline-none transition-colors duration-200 mt-2 ${scorePrediction.away !== ''
                                                    ? 'border-green-500 bg-green-50'
                                                    : 'border-gray-300 hover:border-gray-400 focus:border-indigo-500'
                                                    }`}
                                                disabled={isLive || isFinished}
                                                onFocus={(e) => e.target.select()}
                                            />
                                        </div>
                                    </div>

                                    {(scorePrediction.home !== '' || scorePrediction.away !== '') && (
                                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                                            {scorePrediction.home !== '' && scorePrediction.away !== '' && (
                                                <div className="inline-flex items-center gap-2 bg-blue-100 px-3 py-1.5 rounded-full border border-blue-200">
                                                    <span className="text-blue-600 text-xs font-condensed">
                                                        ⚽ Prediksi: {scorePrediction.home}-{scorePrediction.away}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex gap-2">
                                                {scorePrediction.home !== '' && scorePrediction.away !== '' && (
                                                    <button
                                                        onClick={handleSubmitScore}
                                                        disabled={isSubmitting}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-condensed hover:bg-blue-700 transition-colors disabled:opacity-50"
                                                        type="button"
                                                    >
                                                        {isSubmitting ? '...' : '⚽ Submit Score'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={cancelScorePrediction}
                                                    className="px-3 py-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                    type="button"
                                                >
                                                    ❌ Clear
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {isLive && (
                    <div className="text-center py-4 sm:py-6">
                        <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🔴</div>
                        <h4 className="text-sm sm:text-base font-condensed text-red-600 mb-1 sm:mb-2">Match in Progress</h4>
                        <p className="text-xs sm:text-sm text-gray-600">Predictions locked during live match</p>
                    </div>
                )}

                {isFinished && (
                    <div className="text-center py-4 sm:py-6">
                        <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🏁</div>
                        <h4 className="text-sm sm:text-base font-condensed text-gray-900 mb-1 sm:mb-2">Match Finished</h4>
                        <div className="text-lg sm:text-xl font-condensed text-gray-900 mb-2 sm:mb-3">
                            Final: {currentScore.home} - {currentScore.away}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const HighlightsSection = () => {
        const [highlights, setHighlights] = useState([]);
        const [loading, setLoading] = useState(true);
        const [currentVideo, setCurrentVideo] = useState(0);

        useEffect(() => {
            const fetchHighlights = async () => {
                if (!liveMatchData?.id) return;

                try {
                    setLoading(true);
                    const matchId = liveMatchData.match_number || liveMatchData.id;
                    const response = await fetch(`http://localhost:3000/api/highlights/${matchId}`);
                    const data = await response.json();

                    if (data.success && data.highlights.length > 0) {
                        setHighlights(data.highlights);
                        setCurrentVideo(0);
                    }
                } catch (error) {
                    console.log('Error fetching highlights:', error);
                } finally {
                    setLoading(false);
                }
            };

            fetchHighlights();
        }, [liveMatchData?.id]);

        const getEmbedUrl = (videoUrl, videoType) => {
            if (videoType === 'youtube') {
                const videoId = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)?.[1];
                return videoId ? `https://www.youtube.com/embed/${videoId}` : `https://www.youtube.com/embed/${videoUrl}`;
            }
            return videoUrl;
        };

        if (loading) {
            return (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="flex items-center gap-2 p-4 border-b border-gray-100">
                        <span className="text-lg">🎬</span>
                        <h3 className="font-condensed text-gray-900">Match Highlights</h3>
                    </div>
                    <div className="p-4 text-center">
                        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Loading highlights...</p>
                    </div>
                </div>
            );
        }

        if (highlights.length === 0) {
            return (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="flex items-center gap-2 p-4 border-b border-gray-100">
                        <span className="text-lg">🎬</span>
                        <h3 className="font-condensed text-gray-900">Match Highlights</h3>
                    </div>
                    <div className="p-4 text-center">
                        <div className="text-3xl mb-3">🎥</div>
                        <p className="text-sm text-gray-600 font-condensed">No Live Video</p>
                        <p className="text-xs text-gray-500 font-condensed">Check back after the match is Live</p>
                    </div>
                </div>
            );
        }

        const currentHighlight = highlights[currentVideo];

        return (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🎬</span>
                        <h3 className="font-condensed text-gray-900">Match Highlights</h3>
                    </div>

                    {highlights.length > 1 && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentVideo(prev => prev > 0 ? prev - 1 : highlights.length - 1)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                                ←
                            </button>
                            <span className="text-xs text-gray-600 px-2">
                                {currentVideo + 1} / {highlights.length}
                            </span>
                            <button
                                onClick={() => setCurrentVideo(prev => prev < highlights.length - 1 ? prev + 1 : 0)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                                →
                            </button>
                        </div>
                    )}
                </div>

                <div className="aspect-video">
                    <iframe
                        src={getEmbedUrl(currentHighlight.video_url, currentHighlight.video_type)}
                        className="w-full h-full"
                        allowFullScreen
                        title={currentHighlight.title || 'Match Highlights'}
                    />
                </div>

                {currentHighlight.title && (
                    <div className="p-3 bg-gray-50">
                        <h4 className="text-sm font-condensed text-gray-900">{currentHighlight.title}</h4>
                        {currentHighlight.description && (
                            <p className="text-xs text-gray-600 mt-1">{currentHighlight.description}</p>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Other sections remain the same...
    const SeasonChallengeSection = () => (
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-4">
                <Gift className="w-5 h-5 text-purple-600" />
                <h3 className="font-condensed text-gray-900">Season Challenge</h3>
            </div>
            <div className="text-center py-4">
                <div className="text-2xl mb-2">🏆</div>
                <p className="text-sm text-gray-600 mb-3 font-condensed">Join the season challenge!</p>
                <button className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-condensed hover:bg-purple-700 transition-colors">
                    View Challenge
                </button>
            </div>
        </div>
    );

    // Rest of the components remain the same...
    const InfoDetailSection = () => {
        const countryInfo = getCountryInfo(liveMatchData.league, liveMatchData);

        return (
            <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <h3 className="font-condensed text-gray-900">Info Detail</h3>
                </div>

                <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-condensed text-gray-900">
                            {liveMatchData.kickoff_date || dayjs(liveMatchData.kickoff || liveMatchData.kick_off).format('DD MMMM YYYY')}
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Kickoff:</span>
                        <span className="font-condensed text-gray-900">
                            {liveMatchData.kickoff_time || dayjs(liveMatchData.kickoff || liveMatchData.kick_off).format('HH:mm')}
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Stadium:</span>
                        <span className="font-condensed text-gray-900">
                            {liveMatchData.venue || 'Unknown Venue'}
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Country:</span>
                        <div className="flex items-center gap-2">
                            <img
                                src={countryInfo.flag}
                                alt={countryInfo.country}
                                className="w-4 h-4 rounded-sm"
                            />
                            <span className="font-condensed text-gray-900">{countryInfo.country}</span>
                        </div>
                    </div>

                    {isLive && (
                        <>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Status:</span>
                                <span className="font-condensed text-red-600">🔴 Live</span>
                            </div>

                            {(liveMatchData.minute || liveMatchData.elapsed) && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Minute:</span>
                                    <span className="font-condensed text-red-600">{liveMatchData.minute || liveMatchData.elapsed}'</span>
                                </div>
                            )}

                            {lastUpdate && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Last Update:</span>
                                    <span className="font-condensed text-green-600">
                                        {lastUpdate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            )}
                        </>
                    )}

                    {/* Connection status */}
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Data Source:</span>
                        <span className={`font-condensed ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                            {isConnected ? '🟢 via NobarMeriah' : '🔴 Offline'}
                        </span>
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

    const RightTabNavigation = () => {
        const tabs = [
            { id: 'events', label: 'Events', icon: Activity },
            { id: 'h2h', label: 'H2H', icon: TrendingUp },
            { id: 'lineups', label: 'Lineups', icon: User },
            { id: 'standing', label: 'Klasemen', icon: Trophy }
        ];

        return (
            <div className="bg-white rounded-xl shadow-lg mb-4 overflow-hidden">
                <div className="flex">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-1 py-3 px-2 text-xs font-condensed transition-all ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon className="w-3 h-3" />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto"
        >
            <MatchHeader />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                    <OddsSection />
                    <PredictionSection />
                    <SeasonChallengeSection />
                    <InfoDetailSection />
                    <AdSection />
                </div>

                <div className="lg:col-span-3">
                    {/* Mobile Highlights - Show on mobile only */}
                    <div className="block sm:hidden mb-6">
                        <HighlightsSection />
                    </div>

                    {/* Desktop Highlights - Show on desktop only */}
                    <div className="hidden sm:block mb-4">
                        <HighlightsSection />
                    </div>

                    <RightTabNavigation />
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Tab content would go here */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-4">🚀</div>
                                    <h3 className="text-xl font-condensed text-gray-900 mb-2">
                                        {activeTab === 'events' && 'Match Events'}
                                        {activeTab === 'h2h' && 'Head to Head'}
                                        {activeTab === 'lineups' && 'Team Lineups'}
                                        {activeTab === 'standing' && 'League Standings'}
                                    </h3>
                                    <p className="text-gray-600">Real data from via NobarMeriah</p>
                                    <p className="text-sm text-green-600 mt-2">
                                        {isConnected ? 'Connected to via NobarMeriah' : 'Connecting...'}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
                <button
                    onClick={goBack}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-condensed hover:bg-gray-300 transition-colors"
                >
                    ← Back to Matches
                </button>

                {detailsLoading && (
                    <div className="flex items-center gap-2 text-blue-600">
                        <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        <span className="text-sm">Loading match details...</span>
                    </div>
                )}
            </div>

            <GoalNotificationPortal
                {...goalNotification}
                onClose={() => setGoalNotification(prev => ({ ...prev, show: false }))}
            />
        </motion.div>
    );
};

export default ImprovedMatchLayout;