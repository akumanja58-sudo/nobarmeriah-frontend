// HeadToHeadSection.jsx - Head to Head Component
import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, AlertCircle, MessageSquare } from 'lucide-react';
import dayjs from 'dayjs';

const API_BASE = 'http://localhost:5000';

const HeadToHeadSection = ({ matchData }) => {
    const [h2hData, setH2hData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchH2H = async () => {
        if (!matchData?.home_team_id || !matchData?.away_team_id) {
            console.log('Missing team IDs:', {
                home: matchData?.home_team_id,
                away: matchData?.away_team_id
            });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('Fetching H2H for teams:', matchData.home_team_id, 'vs', matchData.away_team_id);

            const response = await fetch(
                `${API_BASE}/api/fixtures/headtohead/${matchData.home_team_id}/${matchData.away_team_id}`
            );
            const data = await response.json();

            console.log('H2H API Response:', data);

            if (data.success && data.data) {
                // Check if we have the expected structure or raw head_to_head data
                if (data.data.matchup_info && data.data.overall_record) {
                    // Backend returns full analysis format
                    setH2hData(data.data);
                } else if (data.data.head_to_head && Array.isArray(data.data.head_to_head)) {
                    // Backend returns raw matches, create simple structure
                    const matches = data.data.head_to_head;

                    // Calculate basic stats
                    let team1Wins = 0, team2Wins = 0, draws = 0;
                    let totalGoals = 0;

                    matches.forEach(match => {
                        totalGoals += (match.home_score || 0) + (match.away_score || 0);

                        if (match.home_score > match.away_score) {
                            if (match.home_team_id === matchData.home_team_id) team1Wins++;
                            else team2Wins++;
                        } else if (match.away_score > match.home_score) {
                            if (match.away_team_id === matchData.home_team_id) team1Wins++;
                            else team2Wins++;
                        } else {
                            draws++;
                        }
                    });

                    const simpleData = {
                        matchup_info: {
                            total_meetings: matches.length,
                            team1: { name: matchData.home_team },
                            team2: { name: matchData.away_team }
                        },
                        overall_record: {
                            team1_wins: team1Wins,
                            team2_wins: team2Wins,
                            draws: draws
                        },
                        goals_record: {
                            total_goals: totalGoals,
                            avg_goals_per_match: matches.length > 0 ?
                                (totalGoals / matches.length).toFixed(1) : '0.0'
                        },
                        recent_matches: matches.slice(0, 5).map(match => ({
                            date: match.date,
                            home_team: match.home_team_name,
                            away_team: match.away_team_name,
                            score: `${match.home_score || 0}-${match.away_score || 0}`,
                            league: match.league_name || 'Unknown League'
                        }))
                    };

                    setH2hData(simpleData);
                } else {
                    setH2hData(null);
                }
            } else {
                throw new Error(data.error || 'No H2H data available');
            }
        } catch (err) {
            console.error('H2H fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchH2H();
    }, [matchData?.home_team_id, matchData?.away_team_id]);

    // Loading state
    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <h3 className="font-condensed text-gray-900">Head to Head</h3>
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin ml-auto"></div>
                </div>
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="h-12 bg-gray-100 rounded-lg"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <h3 className="font-condensed text-gray-900">Head to Head</h3>
                    </div>
                    <button
                        onClick={fetchH2H}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        title="Retry"
                    >
                        <RefreshCw className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
                <div className="text-center py-8">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">{error}</p>
                    <button
                        onClick={fetchH2H}
                        className="text-xs text-blue-600 hover:text-blue-700 underline"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    // No data state
    if (!h2hData || !h2hData.matchup_info) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <h3 className="font-condensed text-gray-900">Head to Head</h3>
                </div>
                <div className="text-center py-8">
                    <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No H2H data available</p>
                    <p className="text-xs text-gray-500 mt-1">
                        Teams: {matchData?.home_team} vs {matchData?.away_team}
                    </p>
                </div>
            </div>
        );
    }

    const { overall_record, goals_record, recent_matches, matchup_info } = h2hData;

    // Main content
    return (
        <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <h3 className="font-condensed text-gray-900">Head to Head</h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                        Last {matchup_info.total_meetings} meetings
                    </span>
                    <button
                        onClick={fetchH2H}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Overall Record */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-condensed text-gray-700 mb-3">Overall Record</h4>
                <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                        <div className="text-lg font-bold text-blue-600">
                            {overall_record.team1_wins}
                        </div>
                        <div className="text-xs text-gray-500 truncate px-1">
                            {matchData.home_team}
                        </div>
                    </div>
                    <div className="text-center flex-1">
                        <div className="text-lg font-bold text-gray-600">
                            {overall_record.draws}
                        </div>
                        <div className="text-xs text-gray-500">Draws</div>
                    </div>
                    <div className="text-center flex-1">
                        <div className="text-lg font-bold text-green-600">
                            {overall_record.team2_wins}
                        </div>
                        <div className="text-xs text-gray-500 truncate px-1">
                            {matchData.away_team}
                        </div>
                    </div>
                </div>
            </div>

            {/* Goals Record */}
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <h4 className="text-sm font-condensed text-gray-700 mb-2">Goals Average</h4>
                <div className="flex justify-between text-sm">
                    <span>Avg Goals/Match: {goals_record.avg_goals_per_match}</span>
                    <span>Total Goals: {goals_record.total_goals}</span>
                </div>
            </div>

            {/* Recent Matches */}
            <div>
                <h4 className="text-sm font-condensed text-gray-700 mb-3">Recent Matches</h4>
                {recent_matches && recent_matches.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {recent_matches.map((match, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between text-sm py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex-shrink-0">
                                    <span className="text-gray-600 font-mono">
                                        {dayjs(match.date).format('DD/MM/YY')}
                                    </span>
                                </div>
                                <div className="flex-1 text-center px-2">
                                    <span className="font-condensed text-gray-900">
                                        {match.home_team} <span className="font-bold">{match.score}</span> {match.away_team}
                                    </span>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                    <span className="text-xs text-gray-500 truncate max-w-[80px] block">
                                        {match.league}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                        No recent matches found
                    </div>
                )}
            </div>

            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <details className="text-xs text-gray-500">
                        <summary className="cursor-pointer">Debug Info</summary>
                        <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">
                            Team IDs: {matchData?.home_team_id} vs {matchData?.away_team_id}
                        </pre>
                    </details>
                </div>
            )}
        </div>
    );
};

export default HeadToHeadSection;