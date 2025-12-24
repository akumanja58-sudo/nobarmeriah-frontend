// src/components/TestMatches.jsx
import React from 'react';
import { useEnhancedLiveMatches } from '../hooks/useEnhancedLivescore';

const TestMatches = () => {
    const {
        matches,
        loading,
        connected,
        error,
        lastUpdated,
        liveUpdateCount,
        refresh
    } = useEnhancedLiveMatches(true, 0); // autoStart true, no interval

    console.log('[TestMatches] Component rendered with:', {
        matchesLength: matches.length,
        loading,
        connected,
        error,
        liveUpdateCount
    });

    return (
        <div style={{
            padding: '20px',
            border: '2px solid #ccc',
            margin: '20px',
            backgroundColor: '#f9f9f9',
            fontFamily: 'Arial, sans-serif'
        }}>
            <h2 style={{ color: '#333' }}>🧪 Test Matches Component</h2>

            <div style={{ marginBottom: '15px' }}>
                <strong>Status:</strong>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                    <li>Loading: {loading ? '✅ Yes' : '❌ No'}</li>
                    <li>Connected: {connected ? '✅ Yes' : '❌ No'}</li>
                    <li>Error: {error ? `❌ ${error}` : '✅ None'}</li>
                    <li>Live Update Count: {liveUpdateCount}</li>
                    <li>Last Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}</li>
                </ul>
            </div>

            <div style={{ marginBottom: '15px' }}>
                <strong>Matches: {matches.length}</strong>
                <button
                    onClick={refresh}
                    style={{
                        marginLeft: '10px',
                        padding: '5px 10px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    🔄 Refresh
                </button>
            </div>

            {matches.length > 0 ? (
                <div>
                    <h3>First 5 Matches:</h3>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {matches.slice(0, 5).map((match, index) => (
                            <div
                                key={match.id || index}
                                style={{
                                    padding: '10px',
                                    margin: '5px 0',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    backgroundColor: match.is_live ? '#ffe6e6' : '#f0f0f0'
                                }}
                            >
                                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                    {match.home_team} vs {match.away_team}
                                    {match.is_live && <span style={{ color: 'red', marginLeft: '10px' }}>🔴 LIVE</span>}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                    League: {match.league} | Country: {match.country}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    Score: {match.home_score} - {match.away_score} | Status: {match.status}
                                </div>
                                {match.date && (
                                    <div style={{ fontSize: '11px', color: '#888' }}>
                                        Date: {new Date(match.date).toLocaleString()}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
                        <strong>Match Sample (Raw Data):</strong>
                        <pre style={{
                            backgroundColor: '#f8f8f8',
                            padding: '10px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            overflow: 'auto',
                            maxHeight: '200px'
                        }}>
                            {JSON.stringify(matches[0], null, 2)}
                        </pre>
                    </div>
                </div>
            ) : (
                <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#666',
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffeaa7',
                    borderRadius: '4px'
                }}>
                    {loading ? '⏳ Loading matches...' : '❌ No matches found'}
                    {error && <div style={{ color: 'red', marginTop: '10px' }}>Error: {error}</div>}
                </div>
            )}
        </div>
    );
};

export default TestMatches;