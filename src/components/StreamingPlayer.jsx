// StreamingPlayer.jsx - Live Streaming Player Component
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Tv, Radio, RefreshCw, ExternalLink,
    AlertCircle, Loader2, Volume2, Maximize,
    MonitorPlay, Signal, WifiOff, Clock, Calendar,
    CheckCircle, Timer
} from 'lucide-react';
import streamingService from '../services/StreamingService';

const StreamingPlayer = ({
    homeTeam,
    awayTeam,
    matchDate,
    matchId,
    isLive = false,
    isFinished = false,
    matchStatus = 'NS' // NS = Not Started, LIVE, FT = Finished, etc.
}) => {
    const [loading, setLoading] = useState(false);
    const [streamData, setStreamData] = useState(null);
    const [error, setError] = useState(null);
    const [selectedSource, setSelectedSource] = useState(0);
    const [sources, setSources] = useState([]);
    const [showPlayer, setShowPlayer] = useState(false);
    const [countdown, setCountdown] = useState(null);
    const [matchState, setMatchState] = useState('upcoming'); // upcoming, live, finished

    // Determine match state based on props and time
    useEffect(() => {
        const determineMatchState = () => {
            // Check if match is finished
            const finishedStatuses = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'CANC', 'ABD', 'PST'];
            if (isFinished || finishedStatuses.includes(matchStatus?.toUpperCase())) {
                setMatchState('finished');
                return;
            }

            // Check if match is live
            const liveStatuses = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT'];
            if (isLive || liveStatuses.includes(matchStatus?.toUpperCase())) {
                setMatchState('live');
                return;
            }

            // Check based on match date
            if (matchDate) {
                const now = new Date().getTime();
                const matchTime = new Date(matchDate).getTime();
                const diffMs = matchTime - now;

                // If match time has passed by more than 2 hours, consider it finished
                if (diffMs < -2 * 60 * 60 * 1000) {
                    setMatchState('finished');
                }
                // If match time is within -15 min to +2 hours, consider it live
                else if (diffMs < 15 * 60 * 1000 && diffMs > -2 * 60 * 60 * 1000) {
                    setMatchState('live');
                }
                // Otherwise upcoming
                else {
                    setMatchState('upcoming');
                }
            } else {
                setMatchState('upcoming');
            }
        };

        determineMatchState();
    }, [isLive, isFinished, matchStatus, matchDate]);

    // Countdown timer for upcoming matches
    useEffect(() => {
        if (matchState !== 'upcoming' || !matchDate) {
            setCountdown(null);
            return;
        }

        const updateCountdown = () => {
            const now = new Date().getTime();
            const matchTime = new Date(matchDate).getTime();
            const diff = matchTime - now;

            if (diff <= 0) {
                setCountdown(null);
                setMatchState('live'); // Auto switch to live when time comes
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setCountdown({ days, hours, minutes, seconds, total: diff });
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [matchState, matchDate]);

    // Fetch stream only when match is live
    useEffect(() => {
        if (matchState === 'live' && homeTeam && awayTeam) {
            fetchStream();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matchState, homeTeam, awayTeam]);

    const fetchStream = async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await streamingService.findStream(
                homeTeam,
                awayTeam,
                matchDate ? new Date(matchDate).getTime() : null
            );

            if (result.success && result.match) {
                // Fetch stream details to get embed URLs
                const matchId = result.match.id;
                console.log('[StreamingPlayer] Found match, fetching details for:', matchId);

                const streamDetails = await streamingService.getStreamDetails(matchId);
                console.log('[StreamingPlayer] Stream details:', streamDetails);

                // Merge stream details into result
                const fullResult = {
                    ...result,
                    stream: streamDetails
                };

                setStreamData(fullResult);

                // Get available sources from stream details
                const streamSources = streamingService.getStreamSources(streamDetails);
                console.log('[StreamingPlayer] Sources found:', streamSources.length);
                setSources(streamSources);

                if (streamSources.length > 0) {
                    setSelectedSource(0);
                }
            } else {
                setError(result.error || 'Stream not available');
            }
        } catch (err) {
            setError('Failed to load stream');
            console.error('[StreamingPlayer] Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSourceChange = (index) => {
        setSelectedSource(index);
        setShowPlayer(false);
        setTimeout(() => setShowPlayer(true), 100);
    };

    const getCurrentEmbed = () => {
        if (sources.length > 0 && sources[selectedSource]) {
            return sources[selectedSource].embed;
        }
        return streamingService.getEmbedUrl(streamData?.stream);
    };

    const formatMatchDate = () => {
        if (!matchDate) return '';
        const date = new Date(matchDate);
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatMatchTime = () => {
        if (!matchDate) return '';
        const date = new Date(matchDate);
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Jakarta'
        }) + ' WIB';
    };

    // ============= UPCOMING MATCH - COUNTDOWN =============
    if (matchState === 'upcoming') {
        return (
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden">
                <div className="p-6 text-center">
                    {/* Header */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <Clock className="w-5 h-5 text-blue-400" />
                        <span className="text-blue-400 font-medium">Match Belum Dimulai</span>
                    </div>

                    {/* Match Info */}
                    <div className="mb-6">
                        <h3 className="text-white text-xl font-bold mb-2">
                            {homeTeam} vs {awayTeam}
                        </h3>
                        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                            <Calendar className="w-4 h-4" />
                            <span>{formatMatchDate()}</span>
                        </div>
                        <div className="text-gray-400 text-sm mt-1">
                            Kickoff: {formatMatchTime()}
                        </div>
                    </div>

                    {/* Countdown */}
                    {countdown && (
                        <div className="mb-6">
                            <p className="text-gray-400 text-sm mb-3">Match dimulai dalam:</p>
                            <div className="flex justify-center gap-3">
                                {countdown.days > 0 && (
                                    <div className="bg-gray-800 rounded-lg p-3 min-w-[70px]">
                                        <div className="text-2xl font-bold text-white">{countdown.days}</div>
                                        <div className="text-xs text-gray-400">Hari</div>
                                    </div>
                                )}
                                <div className="bg-gray-800 rounded-lg p-3 min-w-[70px]">
                                    <div className="text-2xl font-bold text-white">{countdown.hours.toString().padStart(2, '0')}</div>
                                    <div className="text-xs text-gray-400">Jam</div>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-3 min-w-[70px]">
                                    <div className="text-2xl font-bold text-white">{countdown.minutes.toString().padStart(2, '0')}</div>
                                    <div className="text-xs text-gray-400">Menit</div>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-3 min-w-[70px]">
                                    <div className="text-2xl font-bold text-blue-400">{countdown.seconds.toString().padStart(2, '0')}</div>
                                    <div className="text-xs text-gray-400">Detik</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Info */}
                    <div className="bg-gray-800/50 rounded-lg p-4 text-left">
                        <h4 className="text-gray-300 text-sm font-medium mb-2 flex items-center gap-2">
                            <Tv className="w-4 h-4" />
                            Info Streaming
                        </h4>
                        <ul className="text-gray-400 text-xs space-y-1">
                            <li>• Stream biasanya tersedia 5-15 menit sebelum kickoff</li>
                            <li>• Halaman akan otomatis update saat match dimulai</li>
                            <li>• Liga besar (EPL, La Liga, Serie A) punya coverage lebih baik</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Timer className="w-4 h-4" />
                            <span>Menunggu kickoff...</span>
                        </div>
                        <span className="text-xs text-gray-500">NobarMeriah Stream</span>
                    </div>
                </div>
            </div>
        );
    }

    // ============= FINISHED MATCH =============
    if (matchState === 'finished') {
        return (
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden">
                <div className="p-6 text-center">
                    {/* Header */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-green-400 font-medium">Match Selesai</span>
                    </div>

                    {/* Match Info */}
                    <div className="mb-6">
                        <h3 className="text-white text-xl font-bold mb-2">
                            {homeTeam} vs {awayTeam}
                        </h3>
                        <p className="text-gray-400 text-sm">
                            Pertandingan sudah berakhir
                        </p>
                    </div>

                    {/* Icon */}
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">⚽</span>
                    </div>

                    {/* Info */}
                    <div className="bg-gray-800/50 rounded-lg p-4">
                        <p className="text-gray-400 text-sm">
                            Live streaming tidak tersedia untuk match yang sudah selesai.
                            Cek tab <span className="text-blue-400">Events</span> untuk melihat highlight pertandingan.
                        </p>
                    </div>

                    {/* Search Highlights */}
                    <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${homeTeam} vs ${awayTeam} highlights`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <Play className="w-4 h-4" />
                        Cari Highlights di YouTube
                    </a>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-700">
                    <div className="flex items-center justify-center text-sm text-gray-500">
                        Match telah berakhir
                    </div>
                </div>
            </div>
        );
    }

    // ============= LIVE MATCH - LOADING =============
    if (loading) {
        return (
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-red-400 animate-spin" />
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <p className="text-gray-300">Mencari live stream...</p>
                    </div>
                    <p className="text-gray-500 text-sm">{homeTeam} vs {awayTeam}</p>
                </div>
            </div>
        );
    }

    // ============= LIVE MATCH - NO STREAM =============
    if (error || !streamData) {
        // Check if it's Indonesian league
        const isIndonesianLeague = homeTeam?.toLowerCase().includes('persib') ||
            homeTeam?.toLowerCase().includes('persija') ||
            homeTeam?.toLowerCase().includes('arema') ||
            homeTeam?.toLowerCase().includes('persebaya') ||
            homeTeam?.toLowerCase().includes('psis') ||
            homeTeam?.toLowerCase().includes('psm') ||
            homeTeam?.toLowerCase().includes('bali united') ||
            homeTeam?.toLowerCase().includes('borneo') ||
            homeTeam?.toLowerCase().includes('madura') ||
            homeTeam?.toLowerCase().includes('persis') ||
            homeTeam?.toLowerCase().includes('persik') ||
            homeTeam?.toLowerCase().includes('dewa united') ||
            homeTeam?.toLowerCase().includes('bhayangkara') ||
            homeTeam?.toLowerCase().includes('rans') ||
            homeTeam?.toLowerCase().includes('sriwijaya') ||
            homeTeam?.toLowerCase().includes('psms') ||
            awayTeam?.toLowerCase().includes('persib') ||
            awayTeam?.toLowerCase().includes('persija') ||
            awayTeam?.toLowerCase().includes('arema') ||
            awayTeam?.toLowerCase().includes('persebaya') ||
            awayTeam?.toLowerCase().includes('psis') ||
            awayTeam?.toLowerCase().includes('psm') ||
            awayTeam?.toLowerCase().includes('bali united') ||
            awayTeam?.toLowerCase().includes('borneo') ||
            awayTeam?.toLowerCase().includes('madura') ||
            awayTeam?.toLowerCase().includes('persis') ||
            awayTeam?.toLowerCase().includes('persik') ||
            awayTeam?.toLowerCase().includes('dewa united') ||
            awayTeam?.toLowerCase().includes('bhayangkara') ||
            awayTeam?.toLowerCase().includes('rans') ||
            awayTeam?.toLowerCase().includes('sriwijaya') ||
            awayTeam?.toLowerCase().includes('psms');

        return (
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8">
                <div className="text-center">
                    {/* Live indicator */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-red-400 text-sm font-medium">LIVE</span>
                    </div>

                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <WifiOff className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-white text-lg font-semibold mb-2">
                        Stream Tidak Tersedia
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                        {isIndonesianLeague
                            ? 'Liga Indonesia tidak tersedia di platform ini'
                            : 'Tidak ada stream yang ditemukan untuk match ini'}
                    </p>

                    {/* Alternatif untuk Liga Indonesia */}
                    {isIndonesianLeague ? (
                        <div className="space-y-3">
                            <p className="text-gray-300 text-sm mb-3">Tonton di platform resmi:</p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <a
                                    href="https://www.vidio.com/live/205-bri-liga-1"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Tv className="w-4 h-4" />
                                    Vidio.com
                                </a>
                                <a
                                    href="https://www.mola.tv"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    <Tv className="w-4 h-4" />
                                    Mola TV
                                </a>
                            </div>
                            <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(`${homeTeam} vs ${awayTeam} live stream`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors mt-2"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Cari Online
                            </a>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={fetchStream}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Coba Lagi
                            </button>
                            <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(`${homeTeam} vs ${awayTeam} live stream`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Cari Online
                            </a>
                        </div>
                    )}
                </div>

                {/* Tips */}
                <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
                    <h4 className="text-gray-300 text-sm font-medium mb-2">💡 Tips:</h4>
                    <ul className="text-gray-400 text-xs space-y-1">
                        {isIndonesianLeague ? (
                            <>
                                <li>• Liga 1 & Liga 2 Indonesia tayang eksklusif di Vidio.com</li>
                                <li>• Berlangganan Vidio Premier League untuk akses penuh</li>
                                <li>• Beberapa match mungkin gratis di Vidio</li>
                            </>
                        ) : (
                            <>
                                <li>• Stream biasanya tersedia 5-15 menit sebelum kickoff</li>
                                <li>• Liga besar (EPL, La Liga, Serie A) punya coverage lebih baik</li>
                                <li>• Coba refresh beberapa saat lagi</li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        );
    }

    // ============= LIVE MATCH - STREAM AVAILABLE =============
    const embedUrl = getCurrentEmbed();

    return (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-red-400 font-bold">LIVE</span>
                        </div>
                        {streamData.confidence && (
                            <span className="text-xs text-gray-400">
                                ({Math.round(streamData.confidence * 100)}% match)
                            </span>
                        )}
                    </div>
                    <button
                        onClick={fetchStream}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        title="Refresh stream"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                {/* Source selector */}
                {sources.length > 1 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {sources.map((source, idx) => (
                            <button
                                key={source.id}
                                onClick={() => handleSourceChange(idx)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedSource === idx
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                            >
                                <div className="flex items-center gap-1.5">
                                    <Signal className="w-3 h-3" />
                                    {source.name}
                                    {source.quality && (
                                        <span className="text-xs opacity-70">
                                            ({source.quality})
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Player Area */}
            <div className="relative">
                {!showPlayer ? (
                    // Play button overlay
                    <div
                        className="aspect-video bg-gray-800 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-750 transition-colors relative"
                        onClick={() => setShowPlayer(true)}
                    >
                        {/* Match poster if available */}
                        {streamData.match?.poster && (
                            <img
                                src={streamData.match.poster}
                                alt="Match poster"
                                className="absolute inset-0 w-full h-full object-cover opacity-30"
                            />
                        )}

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mb-4 hover:bg-red-500 transition-colors shadow-lg shadow-red-500/30">
                                <Play className="w-10 h-10 text-white ml-1" />
                            </div>
                            <p className="text-white font-medium mb-1">
                                {streamData.match?.title || `${homeTeam} vs ${awayTeam}`}
                            </p>
                            <p className="text-gray-400 text-sm">Klik untuk mulai streaming</p>
                        </div>
                    </div>
                ) : embedUrl ? (
                    // Iframe player
                    <div className="aspect-video bg-black">
                        <iframe
                            src={embedUrl}
                            className="w-full h-full"
                            frameBorder="0"
                            allowFullScreen
                            allow="autoplay; encrypted-media; picture-in-picture"
                            scrolling="no"
                            title={`${homeTeam} vs ${awayTeam} Live Stream`}
                        />
                    </div>
                ) : (
                    // Embed not available
                    <div className="aspect-video bg-gray-800 flex items-center justify-center">
                        <div className="text-center">
                            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                            <p className="text-white">Stream embed tidak tersedia</p>
                            <p className="text-gray-400 text-sm mt-1">Coba source lain</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-gray-400">
                        <span className="flex items-center gap-1">
                            <MonitorPlay className="w-4 h-4" />
                            NobarMeriah Stream
                        </span>
                        {sources[selectedSource]?.quality && (
                            <span className="flex items-center gap-1">
                                <Tv className="w-4 h-4" />
                                {sources[selectedSource].quality}
                            </span>
                        )}
                    </div>

                    {showPlayer && embedUrl && (
                        <a
                            href={embedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Open in new tab
                        </a>
                    )}
                </div>

                {/* Disclaimer */}
                <p className="mt-3 text-xs text-gray-500">
                    ⚠️ Stream disediakan oleh pihak ketiga. Kami tidak meng-host konten apapun.
                </p>
            </div>
        </div>
    );
};

export default StreamingPlayer;
