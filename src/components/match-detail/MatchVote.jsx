'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, Check, Loader2, ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';

export default function MatchVote({ match, user, isFinished }) {
  // Slide state: 0 = Winner Vote, 1 = Score Prediction
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 2;

  // Winner Vote State
  const [userVote, setUserVote] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  const [votes, setVotes] = useState({
    home: 0,
    draw: 0,
    away: 0,
  });

  // Score Prediction State
  const [scorePrediction, setScorePrediction] = useState({ home: '', away: '' });
  const [hasScorePrediction, setHasScorePrediction] = useState(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // ============================================================
  // FETCH EXISTING VOTES & USER'S VOTE
  // ============================================================
  useEffect(() => {
    const fetchVotesData = async () => {
      if (!match?.id) return;

      setIsLoading(true);
      const matchId = parseInt(match.id);

      try {
        // 1. Fetch all votes for this match to calculate percentages
        const { data: allVotes, error: votesError } = await supabase
          .from('winner_predictions')
          .select('predicted_result')
          .eq('match_id', matchId);

        if (!votesError && allVotes) {
          const total = allVotes.length;
          setTotalVotes(total);

          if (total > 0) {
            const homeVotes = allVotes.filter(v => v.predicted_result === 'home').length;
            const drawVotes = allVotes.filter(v => v.predicted_result === 'draw').length;
            const awayVotes = allVotes.filter(v => v.predicted_result === 'away').length;

            setVotes({
              home: Math.round((homeVotes / total) * 100),
              draw: Math.round((drawVotes / total) * 100),
              away: Math.round((awayVotes / total) * 100),
            });
          }
        }

        // 2. Check if user already voted
        if (user?.email) {
          const { data: userVoteData } = await supabase
            .from('winner_predictions')
            .select('predicted_result')
            .eq('match_id', matchId)
            .eq('email', user.email)
            .single();

          if (userVoteData) {
            setUserVote(userVoteData.predicted_result);
            setHasVoted(true);
          }

          // 3. Check if user already predicted score
          const { data: userScoreData } = await supabase
            .from('score_predictions')
            .select('predicted_home_score, predicted_away_score')
            .eq('match_id', matchId)
            .eq('email', user.email)
            .single();

          if (userScoreData) {
            setScorePrediction({
              home: userScoreData.predicted_home_score.toString(),
              away: userScoreData.predicted_away_score.toString()
            });
            setHasScorePrediction(true);
          }
        }
      } catch (error) {
        console.error('Error fetching votes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVotesData();
  }, [match?.id, user?.email]);

  // ============================================================
  // HANDLE WINNER VOTE
  // ============================================================
  const handleVote = async (vote) => {
    if (!user) {
      alert('Login dulu untuk memberikan voting!');
      return;
    }
    if (isFinished) {
      alert('Pertandingan sudah selesai!');
      return;
    }
    if (hasVoted) {
      alert('Kamu sudah voting untuk pertandingan ini!');
      return;
    }

    setIsSubmittingVote(true);

    try {
      const matchId = parseInt(match.id);

      const { error } = await supabase
        .from('winner_predictions')
        .insert([{
          email: user.email,
          match_id: matchId,
          predicted_result: vote,
          status: 'pending'
        }]);

      if (error) {
        console.error('Vote error:', error);
        alert('Gagal menyimpan vote: ' + error.message);
        return;
      }

      // Update local state
      setUserVote(vote);
      setHasVoted(true);

      // Update vote counts
      const newTotal = totalVotes + 1;
      setTotalVotes(newTotal);

      // Recalculate percentages
      const currentVoteCounts = {
        home: Math.round((votes.home / 100) * totalVotes),
        draw: Math.round((votes.draw / 100) * totalVotes),
        away: Math.round((votes.away / 100) * totalVotes),
      };
      currentVoteCounts[vote] += 1;

      setVotes({
        home: Math.round((currentVoteCounts.home / newTotal) * 100),
        draw: Math.round((currentVoteCounts.draw / newTotal) * 100),
        away: Math.round((currentVoteCounts.away / newTotal) * 100),
      });

      alert('🎯 Vote berhasil disimpan!');

    } catch (err) {
      console.error('Vote error:', err);
      alert('Terjadi kesalahan saat voting');
    } finally {
      setIsSubmittingVote(false);
    }
  };

  // ============================================================
  // HANDLE SCORE PREDICTION
  // ============================================================
  const handleSubmitScore = async () => {
    if (!user) {
      alert('Login dulu untuk tebak skor!');
      return;
    }
    if (isFinished) {
      alert('Pertandingan sudah selesai!');
      return;
    }
    if (hasScorePrediction) {
      alert('Kamu sudah menebak skor untuk pertandingan ini!');
      return;
    }
    if (scorePrediction.home === '' || scorePrediction.away === '') {
      alert('Masukkan skor untuk kedua tim!');
      return;
    }

    setIsSubmittingScore(true);

    try {
      const matchId = parseInt(match.id);

      const { error } = await supabase
        .from('score_predictions')
        .insert([{
          email: user.email,
          match_id: matchId,
          predicted_home_score: parseInt(scorePrediction.home),
          predicted_away_score: parseInt(scorePrediction.away),
          status: 'pending'
        }]);

      if (error) {
        console.error('Score prediction error:', error);
        alert('Gagal menyimpan tebakan skor: ' + error.message);
        return;
      }

      setHasScorePrediction(true);
      alert('⚽ Tebakan skor berhasil disimpan!');

    } catch (err) {
      console.error('Score prediction error:', err);
      alert('Terjadi kesalahan saat menebak skor');
    } finally {
      setIsSubmittingScore(false);
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================
  const formatVotes = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);

  // Check if match already started
  const isMatchStarted = ['1H', '2H', 'HT', 'LIVE', 'ET', 'BT', 'P'].includes(
    (match?.status_short || match?.status || '').toUpperCase()
  ) || match?.is_live;

  const canVote = !isFinished && !isMatchStarted && !hasVoted;
  const canPredictScore = !isFinished && !isMatchStarted && !hasScorePrediction;

  // Get team names (shortened for display)
  const homeTeamName = match?.home_team_name || match?.home_team || 'Home';
  const awayTeamName = match?.away_team_name || match?.away_team || 'Away';

  // ============================================================
  // RENDER
  // ============================================================
  if (isLoading) {
    return (
      <div className="match-vote bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-green-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="match-vote bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Slides Container */}
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {/* ============================================================ */}
          {/* SLIDE 1: Winner Vote */}
          {/* ============================================================ */}
          <div className="min-w-full flex-shrink-0">
            <div className="p-4">
              {/* Header */}
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 font-condensed text-sm">Siapa yang akan menang?</h3>
                  {hasVoted ? (
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <ThumbsUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500 font-condensed">
                  {hasVoted ? '✅ Kamu sudah voting!' : `Total voting: ${formatVotes(totalVotes)}`}
                </p>
              </div>

              {/* Team logos row */}
              <div className="grid grid-cols-3 gap-1 mb-2">
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-1 flex items-center justify-center">
                    {match?.home_team_logo ? (
                      <img src={match.home_team_logo} alt="" className="w-8 h-8 object-contain" />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-600 font-condensed truncate">{homeTeamName}</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-1 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="font-bold text-gray-500 text-xs">X</span>
                  </div>
                  <p className="text-[10px] text-gray-600 font-condensed">Seri</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-1 flex items-center justify-center">
                    {match?.away_team_logo ? (
                      <img src={match.away_team_logo} alt="" className="w-8 h-8 object-contain" />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-600 font-condensed truncate">{awayTeamName}</p>
                </div>
              </div>

              {/* Vote buttons row */}
              <div className="grid grid-cols-3 gap-1">
                {/* Home Vote */}
                <button
                  onClick={() => handleVote('home')}
                  disabled={!canVote || isSubmittingVote}
                  className={`relative py-2 rounded-lg border-2 transition-all font-condensed overflow-hidden ${userVote === 'home'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                    } ${!canVote ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div
                    className="absolute inset-0 bg-green-100 transition-all"
                    style={{ width: `${votes.home}%`, opacity: 0.5 }}
                  ></div>
                  <div className="relative flex items-center justify-center gap-0.5">
                    {isSubmittingVote ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <span className="font-bold text-gray-800 text-xs">{votes.home}%</span>
                        {userVote === 'home' && <Check className="w-3 h-3 text-green-500" />}
                      </>
                    )}
                  </div>
                </button>

                {/* Draw Vote */}
                <button
                  onClick={() => handleVote('draw')}
                  disabled={!canVote || isSubmittingVote}
                  className={`relative py-2 rounded-lg border-2 transition-all font-condensed overflow-hidden ${userVote === 'draw'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                    } ${!canVote ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div
                    className="absolute inset-0 bg-gray-200 transition-all"
                    style={{ width: `${votes.draw}%`, opacity: 0.5 }}
                  ></div>
                  <div className="relative flex items-center justify-center gap-0.5">
                    {isSubmittingVote ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <span className="font-bold text-gray-800 text-xs">{votes.draw}%</span>
                        {userVote === 'draw' && <Check className="w-3 h-3 text-green-500" />}
                      </>
                    )}
                  </div>
                </button>

                {/* Away Vote */}
                <button
                  onClick={() => handleVote('away')}
                  disabled={!canVote || isSubmittingVote}
                  className={`relative py-2 rounded-lg border-2 transition-all font-condensed overflow-hidden ${userVote === 'away'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                    } ${!canVote ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div
                    className="absolute inset-0 bg-red-100 transition-all"
                    style={{ width: `${votes.away}%`, opacity: 0.5 }}
                  ></div>
                  <div className="relative flex items-center justify-center gap-0.5">
                    {isSubmittingVote ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <span className="font-bold text-gray-800 text-xs">{votes.away}%</span>
                        {userVote === 'away' && <Check className="w-3 h-3 text-green-500" />}
                      </>
                    )}
                  </div>
                </button>
              </div>

              {/* Status message */}
              {isMatchStarted && !isFinished && (
                <p className="text-[10px] text-orange-600 mt-2 text-center font-condensed">
                  🔴 Pertandingan sedang berlangsung
                </p>
              )}
              {isFinished && (
                <p className="text-[10px] text-gray-500 mt-2 text-center font-condensed">
                  ✅ Pertandingan sudah selesai
                </p>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* SLIDE 2: Score Prediction */}
          {/* ============================================================ */}
          <div className="min-w-full flex-shrink-0">
            <div className="p-4">
              {/* Header */}
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 font-condensed text-sm">Tebak Skor</h3>
                  {hasScorePrediction ? (
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <Target className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500 font-condensed">
                  {hasScorePrediction ? '✅ Kamu sudah menebak!' : 'Tebak skor akhir pertandingan'}
                </p>
              </div>

              {hasScorePrediction ? (
                /* Show submitted prediction */
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs text-green-700 font-condensed mb-2 text-center">Prediksi kamu:</p>
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-center">
                      <div className="w-8 h-8 mx-auto mb-1">
                        {match?.home_team_logo && (
                          <img src={match.home_team_logo} alt="" className="w-8 h-8 object-contain" />
                        )}
                      </div>
                      <p className="text-[10px] text-gray-600 font-condensed truncate max-w-[50px]">{homeTeamName}</p>
                    </div>
                    <div className="text-xl font-bold text-green-700 font-condensed">
                      {scorePrediction.home} - {scorePrediction.away}
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-8 mx-auto mb-1">
                        {match?.away_team_logo && (
                          <img src={match.away_team_logo} alt="" className="w-8 h-8 object-contain" />
                        )}
                      </div>
                      <p className="text-[10px] text-gray-600 font-condensed truncate max-w-[50px]">{awayTeamName}</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Score input form */
                <div className="space-y-3">
                  {/* Team logos and names row */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center">
                      <div className="w-10 h-10 mx-auto mb-1">
                        {match?.home_team_logo ? (
                          <img src={match.home_team_logo} alt="" className="w-10 h-10 object-contain" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-700 font-condensed font-medium truncate">{homeTeamName}</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 mx-auto mb-1">
                        {match?.away_team_logo ? (
                          <img src={match.away_team_logo} alt="" className="w-10 h-10 object-contain" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-700 font-condensed font-medium truncate">{awayTeamName}</p>
                    </div>
                  </div>

                  {/* Score inputs row */}
                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      placeholder="0"
                      value={scorePrediction.home}
                      onChange={(e) => setScorePrediction(prev => ({ ...prev, home: e.target.value }))}
                      disabled={!canPredictScore}
                      className={`w-12 h-12 text-center border-2 rounded-lg text-lg font-bold transition-colors ${scorePrediction.home !== ''
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200'
                        } ${!canPredictScore ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                    <span className="text-lg text-gray-400 font-bold">:</span>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      placeholder="0"
                      value={scorePrediction.away}
                      onChange={(e) => setScorePrediction(prev => ({ ...prev, away: e.target.value }))}
                      disabled={!canPredictScore}
                      className={`w-12 h-12 text-center border-2 rounded-lg text-lg font-bold transition-colors ${scorePrediction.away !== ''
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200'
                        } ${!canPredictScore ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                  </div>

                  {/* Submit Button */}
                  {canPredictScore && scorePrediction.home !== '' && scorePrediction.away !== '' && (
                    <button
                      onClick={handleSubmitScore}
                      disabled={isSubmittingScore}
                      className="w-full py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors font-condensed text-xs flex items-center justify-center gap-1"
                    >
                      {isSubmittingScore ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3" />
                          Kirim Tebakan
                        </>
                      )}
                    </button>
                  )}

                  {/* Status message */}
                  {isMatchStarted && !isFinished && (
                    <p className="text-[10px] text-orange-600 text-center font-condensed">
                      🔴 Pertandingan sedang berlangsung
                    </p>
                  )}
                  {isFinished && (
                    <p className="text-[10px] text-gray-500 text-center font-condensed">
                      ✅ Pertandingan sudah selesai
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <button
          onClick={prevSlide}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 font-condensed"
        >
          <ChevronLeft className="w-4 h-4" />
          Sebelumnya
        </button>
        <div className="flex items-center gap-1.5">
          {[...Array(totalSlides)].map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-2 h-2 rounded-full transition-colors ${currentSlide === idx ? 'bg-green-500' : 'bg-gray-300 hover:bg-gray-400'
                }`}
            />
          ))}
        </div>
        <button
          onClick={nextSlide}
          className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-condensed"
        >
          Berikutnya
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
