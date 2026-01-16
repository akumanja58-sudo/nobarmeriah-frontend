'use client';

import { useState } from 'react';
import { ThumbsUp } from 'lucide-react';

export default function MatchVote({ match, user, isFinished }) {
  const [userVote, setUserVote] = useState(null);
  const [totalVotes] = useState(101000);
  
  // Sample vote percentages
  const [votes] = useState({
    home: 54,
    draw: 11,
    away: 35,
  });

  const handleVote = (vote) => {
    if (!user) {
      alert('Login dulu untuk memberikan voting!');
      return;
    }
    if (isFinished) {
      alert('Pertandingan sudah selesai!');
      return;
    }
    setUserVote(vote);
  };

  const formatVotes = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'k';
    }
    return num;
  };

  return (
    <div className="match-vote bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-800 font-condensed">Siapa yang akan menang?</h3>
          <p className="text-xs text-gray-500 font-condensed">Total voting: {formatVotes(totalVotes)}</p>
        </div>
        <ThumbsUp className="w-5 h-5 text-gray-400" />
      </div>

      {/* Vote Buttons with Percentages */}
      <div className="grid grid-cols-3 gap-2">
        {/* Home Vote */}
        <button
          onClick={() => handleVote('home')}
          disabled={isFinished}
          className={`relative py-3 px-2 rounded-lg border-2 transition-all font-condensed text-sm overflow-hidden ${
            userVote === 'home'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-gray-300'
          } ${isFinished ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {/* Background progress */}
          <div 
            className="absolute inset-0 bg-green-100 transition-all"
            style={{ width: `${votes.home}%`, opacity: 0.5 }}
          ></div>
          
          <div className="relative flex items-center justify-center gap-2">
            {match?.home_team_logo ? (
              <img src={match.home_team_logo} alt="" className="w-6 h-6 object-contain" />
            ) : (
              <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
            )}
            <span className="font-bold text-gray-800">{votes.home}%</span>
          </div>
        </button>

        {/* Draw Vote */}
        <button
          onClick={() => handleVote('draw')}
          disabled={isFinished}
          className={`relative py-3 px-2 rounded-lg border-2 transition-all font-condensed text-sm overflow-hidden ${
            userVote === 'draw'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-gray-300'
          } ${isFinished ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {/* Background progress */}
          <div 
            className="absolute inset-0 bg-gray-200 transition-all"
            style={{ width: `${votes.draw}%`, opacity: 0.5 }}
          ></div>
          
          <div className="relative flex items-center justify-center gap-2">
            <span className="font-bold text-gray-600">X</span>
            <span className="font-bold text-gray-800">{votes.draw}%</span>
          </div>
        </button>

        {/* Away Vote */}
        <button
          onClick={() => handleVote('away')}
          disabled={isFinished}
          className={`relative py-3 px-2 rounded-lg border-2 transition-all font-condensed text-sm overflow-hidden ${
            userVote === 'away'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-gray-300'
          } ${isFinished ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {/* Background progress */}
          <div 
            className="absolute inset-0 bg-red-100 transition-all"
            style={{ width: `${votes.away}%`, opacity: 0.5 }}
          ></div>
          
          <div className="relative flex items-center justify-center gap-2">
            {match?.away_team_logo ? (
              <img src={match.away_team_logo} alt="" className="w-6 h-6 object-contain" />
            ) : (
              <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
            )}
            <span className="font-bold text-gray-800">{votes.away}%</span>
          </div>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <button className="text-sm text-gray-500 hover:text-gray-700 font-condensed">
          ‹ Sebelumnya
        </button>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
          <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
        </div>
        <button className="text-sm text-green-600 hover:text-green-700 font-condensed">
          Berikutnya ›
        </button>
      </div>
    </div>
  );
}
