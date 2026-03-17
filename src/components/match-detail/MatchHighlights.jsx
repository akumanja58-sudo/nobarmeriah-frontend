'use client';

import { useState, useEffect } from 'react';
import { Play, ExternalLink, Loader2, Youtube, X } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function MatchHighlights({ match, isFinished }) {
    const [highlights, setHighlights] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Fetch highlights when match is finished
    useEffect(() => {
        if (!isFinished || !match) return;

        const fetchHighlights = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const homeTeam = match.home_team_name || match.home_team || '';
                const awayTeam = match.away_team_name || match.away_team || '';
                const matchDate = match.date || match.kickoff || '';

                if (!homeTeam || !awayTeam) {
                    console.log('Missing team names for highlights search');
                    return;
                }

                const params = new URLSearchParams({
                    home: homeTeam,
                    away: awayTeam,
                    date: matchDate
                });

                const response = await fetch(`${API_BASE_URL}/api/highlights/search?${params}`);
                const data = await response.json();

                if (data.success && data.data) {
                    setHighlights(data.data);
                    console.log(`📹 Found ${data.data.length} highlights`);
                } else {
                    setError('Tidak ada highlight ditemukan');
                }
            } catch (err) {
                console.error('Error fetching highlights:', err);
                setError('Gagal memuat highlight');
            } finally {
                setIsLoading(false);
            }
        };

        fetchHighlights();
    }, [isFinished, match]);

    // Don't render if match not finished
    if (!isFinished) {
        return null;
    }

    // Handle video click
    const handleVideoClick = (video) => {
        setSelectedVideo(video);
        setShowModal(true);
    };

    // Close modal
    const closeModal = () => {
        setShowModal(false);
        setSelectedVideo(null);
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Youtube className="w-5 h-5 text-red-600" />
                        <h3 className="font-semibold text-gray-800 font-condensed">Highlight</h3>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                            <span className="ml-2 text-sm text-gray-500 font-condensed">Mencari highlight...</span>
                        </div>
                    ) : error ? (
                        <div className="text-center py-6">
                            <Youtube className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 font-condensed">{error}</p>
                        </div>
                    ) : highlights.length === 0 ? (
                        <div className="text-center py-6">
                            <Youtube className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 font-condensed">Belum ada highlight</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Single highlight video */}
                            {highlights[0] && (
                                <div 
                                    className="relative cursor-pointer group"
                                    onClick={() => handleVideoClick(highlights[0])}
                                >
                                    <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                                        <img
                                            src={highlights[0].thumbnail}
                                            alt={highlights[0].title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                e.target.src = '/images/video-placeholder.png';
                                            }}
                                        />
                                        {/* Play overlay */}
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                                            <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                <Play className="w-6 h-6 text-white fill-white ml-1" />
                                            </div>
                                        </div>
                                        {/* Trusted badge */}
                                        {highlights[0].isTrustedChannel && (
                                            <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">
                                                ✓ Official
                                            </div>
                                        )}
                                    </div>
                                    <p className="mt-2 text-sm font-medium text-gray-800 font-condensed line-clamp-2">
                                        {highlights[0].title}
                                    </p>
                                    <p className="text-xs text-gray-500 font-condensed mt-1">
                                        {highlights[0].channelTitle}
                                    </p>
                                </div>
                            )}

                            {/* See more on YouTube */}
                            <a
                                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${match.home_team_name || match.home_team} vs ${match.away_team_name || match.away_team} highlights`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 py-2 text-sm text-red-600 hover:text-red-700 font-condensed transition-colors"
                            >
                                <span>Lihat lebih banyak di YouTube</span>
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Video Modal */}
            {showModal && selectedVideo && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={closeModal}
                    />
                    
                    {/* Modal Content */}
                    <div className="relative w-full max-w-4xl bg-black rounded-xl overflow-hidden shadow-2xl animate-fade-in">
                        {/* Close button */}
                        <button
                            onClick={closeModal}
                            className="absolute top-3 right-3 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* YouTube Embed */}
                        <div className="aspect-video">
                            <iframe
                                src={`${selectedVideo.embedUrl}?autoplay=1&rel=0`}
                                title={selectedVideo.title}
                                className="w-full h-full"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>

                        {/* Video Info */}
                        <div className="p-4 bg-gray-900 text-white">
                            <h4 className="font-semibold font-condensed line-clamp-2">{selectedVideo.title}</h4>
                            <p className="text-sm text-gray-400 font-condensed mt-1">{selectedVideo.channelTitle}</p>
                            
                            {/* Open in YouTube button */}
                            <a
                                href={selectedVideo.watchUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-condensed transition-colors"
                            >
                                <Youtube className="w-4 h-4" />
                                Buka di YouTube
                            </a>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out;
                }
            `}</style>
        </>
    );
}
