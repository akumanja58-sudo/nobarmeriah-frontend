import React, { useState, useEffect } from 'react';
import { X, Volume2 } from 'lucide-react';

const GoalNotification = ({
    show,
    onClose,
    homeTeam,
    awayTeam,
    scorer,
    minute,
    homeScore,
    awayScore,
    teamSide // 'home' or 'away'
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);

    useEffect(() => {
        if (show) {
            setIsVisible(true);

            // Play goal sound
            if (soundEnabled) {
                playGoalSound();
            }

            // Auto close after 5 seconds
            const timer = setTimeout(() => {
                handleClose();
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [show]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
        }, 300); // Wait for animation to complete
    };

    const playGoalSound = () => {
        // try {
        //     // Enhanced goal sound
        //     const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        //     // Create a more complex goal sound
        //     const oscillator1 = audioContext.createOscillator();
        //     const oscillator2 = audioContext.createOscillator();
        //     const gainNode = audioContext.createGain();

        //     oscillator1.connect(gainNode);
        //     oscillator2.connect(gainNode);
        //     gainNode.connect(audioContext.destination);

        //     // Goal horn sound
        //     oscillator1.frequency.setValueAtTime(440, audioContext.currentTime);
        //     oscillator1.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.3);

        //     oscillator2.frequency.setValueAtTime(330, audioContext.currentTime);
        //     oscillator2.frequency.exponentialRampToValueAtTime(660, audioContext.currentTime + 0.3);

        //     gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        //     gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

        //     oscillator1.start(audioContext.currentTime);
        //     oscillator2.start(audioContext.currentTime);
        //     oscillator1.stop(audioContext.currentTime + 0.8);
        //     oscillator2.stop(audioContext.currentTime + 0.8);

        //     console.log('🔊 ⚽ ENHANCED GOAL sound played!');
        // } catch (error) {
        //     console.error('❌ Error playing goal sound:', error);
        // }
        console.log('GOAL sound disabled');
    };

    if (!show) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'
            }`}>
            <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all duration-300 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                }`}>
                {/* Header with close button */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500 to-green-600">
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl">⚽</span>
                        <span className="text-white font-bold text-lg">GOAL!!!</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`p-2 rounded-full ${soundEnabled ? 'bg-white bg-opacity-20' : 'bg-gray-500 bg-opacity-50'}`}
                        >
                            <Volume2 className="w-4 h-4 text-white" />
                        </button>
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </div>

                {/* Goal Details */}
                <div className="p-6">
                    {/* Scorer Info */}
                    <div className="text-center mb-4">
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                            {scorer || 'Unknown Player'}
                        </div>
                        <div className="text-sm text-gray-600">
                            {minute}' minute
                        </div>
                    </div>

                    {/* Score Display */}
                    <div className="bg-gray-100 rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between">
                            <div className="text-center flex-1">
                                <div className="text-sm font-medium text-gray-600 mb-1">{homeTeam}</div>
                                <div className={`text-2xl font-bold ${teamSide === 'home' ? 'text-green-600' : 'text-gray-900'}`}>
                                    {homeScore}
                                </div>
                            </div>

                            <div className="text-gray-400 text-xl font-bold px-4">-</div>

                            <div className="text-center flex-1">
                                <div className="text-sm font-medium text-gray-600 mb-1">{awayTeam}</div>
                                <div className={`text-2xl font-bold ${teamSide === 'away' ? 'text-green-600' : 'text-gray-900'}`}>
                                    {awayScore}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                        <button
                            onClick={handleClose}
                            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                        >
                            Close
                        </button>
                        <button
                            className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors"
                        >
                            Watch Replay
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GoalNotification;