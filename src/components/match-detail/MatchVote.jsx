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

  // Edit Mode State
  const [isEditingVote, setIsEditingVote] = useState(false);
  const [isEditingScore, setIsEditingScore] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
  // HANDLE EDIT WINNER VOTE
  // ============================================================
  const handleEditVote = async (newVote) => {
    if (!user || !hasVoted) return;
    if (isMatchStarted || isFinished) {
      alert('Tidak bisa mengubah vote. Pertandingan sudah dimulai!');
      return;
    }

    setIsSubmittingVote(true);

    try {
      const matchId = parseInt(match.id);

      const { error } = await supabase
        .from('winner_predictions')
        .update({ predicted_result: newVote })
        .eq('match_id', matchId)
        .eq('email', user.email);

      if (error) {
        console.error('Edit vote error:', error);
        alert('Gagal mengubah vote: ' + error.message);
        return;
      }

      // Update local state
      const oldVote = userVote;
      setUserVote(newVote);
      setIsEditingVote(false);

      // Recalculate percentages
      const currentVoteCounts = {
        home: Math.round((votes.home / 100) * totalVotes),
        draw: Math.round((votes.draw / 100) * totalVotes),
        away: Math.round((votes.away / 100) * totalVotes),
      };
      currentVoteCounts[oldVote] -= 1;
      currentVoteCounts[newVote] += 1;

      setVotes({
        home: totalVotes > 0 ? Math.round((currentVoteCounts.home / totalVotes) * 100) : 0,
        draw: totalVotes > 0 ? Math.round((currentVoteCounts.draw / totalVotes) * 100) : 0,
        away: totalVotes > 0 ? Math.round((currentVoteCounts.away / totalVotes) * 100) : 0,
      });

      alert('✅ Vote berhasil diubah!');

    } catch (err) {
      console.error('Edit vote error:', err);
      alert('Terjadi kesalahan saat mengubah vote');
    } finally {
      setIsSubmittingVote(false);
    }
  };

  // ============================================================
  // HANDLE CANCEL/DELETE WINNER VOTE
  // ============================================================
  const handleCancelVote = async () => {
    if (!user || !hasVoted) return;
    if (isMatchStarted || isFinished) {
      alert('Tidak bisa membatalkan vote. Pertandingan sudah dimulai!');
      return;
    }

    if (!confirm('Yakin mau batalkan vote kamu?')) return;

    setIsDeleting(true);

    try {
      const matchId = parseInt(match.id);

      const { error } = await supabase
        .from('winner_predictions')
        .delete()
        .eq('match_id', matchId)
        .eq('email', user.email);

      if (error) {
        console.error('Cancel vote error:', error);
        alert('Gagal membatalkan vote: ' + error.message);
        return;
      }

      // Update local state
      const oldVote = userVote;
      setUserVote(null);
      setHasVoted(false);
      setIsEditingVote(false);

      // Update vote counts
      const newTotal = totalVotes - 1;
      setTotalVotes(newTotal);

      // Recalculate percentages
      const currentVoteCounts = {
        home: Math.round((votes.home / 100) * totalVotes),
        draw: Math.round((votes.draw / 100) * totalVotes),
        away: Math.round((votes.away / 100) * totalVotes),
      };
      currentVoteCounts[oldVote] -= 1;

      setVotes({
        home: newTotal > 0 ? Math.round((currentVoteCounts.home / newTotal) * 100) : 0,
        draw: newTotal > 0 ? Math.round((currentVoteCounts.draw / newTotal) * 100) : 0,
        away: newTotal > 0 ? Math.round((currentVoteCounts.away / newTotal) * 100) : 0,
      });

      alert('🗑️ Vote berhasil dibatalkan!');

    } catch (err) {
      console.error('Cancel vote error:', err);
      alert('Terjadi kesalahan saat membatalkan vote');
    } finally {
      setIsDeleting(false);
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
  // HANDLE EDIT SCORE PREDICTION
  // ============================================================
  const handleEditScore = async () => {
    if (!user || !hasScorePrediction) return;
    if (isMatchStarted || isFinished) {
      alert('Tidak bisa mengubah tebakan. Pertandingan sudah dimulai!');
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
        .update({
          predicted_home_score: parseInt(scorePrediction.home),
          predicted_away_score: parseInt(scorePrediction.away)
        })
        .eq('match_id', matchId)
        .eq('email', user.email);

      if (error) {
        console.error('Edit score error:', error);
        alert('Gagal mengubah tebakan skor: ' + error.message);
        return;
      }

      setIsEditingScore(false);
      alert('✅ Tebakan skor berhasil diubah!');

    } catch (err) {
      console.error('Edit score error:', err);
      alert('Terjadi kesalahan saat mengubah tebakan skor');
    } finally {
      setIsSubmittingScore(false);
    }
  };

  // ============================================================
  // HANDLE CANCEL/DELETE SCORE PREDICTION
  // ============================================================
  const handleCancelScore = async () => {
    if (!user || !hasScorePrediction) return;
    if (isMatchStarted || isFinished) {
      alert('Tidak bisa membatalkan tebakan. Pertandingan sudah dimulai!');
      return;
    }

    if (!confirm('Yakin mau batalkan tebakan skor kamu?')) return;

    setIsDeleting(true);

    try {
      const matchId = parseInt(match.id);

      const { error } = await supabase
        .from('score_predictions')
        .delete()
        .eq('match_id', matchId)
        .eq('email', user.email);

      if (error) {
        console.error('Cancel score error:', error);
        alert('Gagal membatalkan tebakan skor: ' + error.message);
        return;
      }

      // Reset state
      setScorePrediction({ home: '', away: '' });
      setHasScorePrediction(false);
      setIsEditingScore(false);

      alert('🗑️ Tebakan skor berhasil dibatalkan!');

    } catch (err) {
      console.error('Cancel score error:', err);
      alert('Terjadi kesalahan saat membatalkan tebakan skor');
    } finally {
      setIsDeleting(false);
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
  const canEdit = !isFinished && !isMatchStarted; // Bisa edit kalau match belum mulai

  // Get team names (shortened for display)
  const getShortName = (name, maxLen = 12) => {
    if (!name) return 'Team';
    if (name.length <= maxLen) return name;
    return name.substring(0, maxLen) + '...';
  };

  const homeTeamName = match?.home_team_name || match?.home_team || 'Home';
  const awayTeamName = match?.away_team_name || match?.away_team || 'Away';
  const homeTeamShort = getShortName(homeTeamName, 10);
  const awayTeamShort = getShortName(awayTeamName, 10);

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
                  <p className="text-[10px] text-gray-600 font-condensed truncate" title={homeTeamName}>{homeTeamShort}</p>
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
                  <p className="text-[10px] text-gray-600 font-condensed truncate" title={awayTeamName}>{awayTeamShort}</p>
                </div>
              </div>

              {/* Vote buttons row */}
              <div className="grid grid-cols-3 gap-1">
                {/* Home Vote */}
                <button
                  onClick={() => isEditingVote ? handleEditVote('home') : handleVote('home')}
                  disabled={(!canVote && !isEditingVote) || isSubmittingVote || (isEditingVote && userVote === 'home')}
                  className={`relative py-2 rounded-lg border-2 transition-all font-condensed overflow-hidden ${userVote === 'home'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                    } ${(!canVote && !isEditingVote) ? 'opacity-60 cursor-not-allowed' : ''} ${isEditingVote && userVote !== 'home' ? 'hover:border-green-400 hover:bg-green-50/50 cursor-pointer opacity-100' : ''}`}
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
                  onClick={() => isEditingVote ? handleEditVote('draw') : handleVote('draw')}
                  disabled={(!canVote && !isEditingVote) || isSubmittingVote || (isEditingVote && userVote === 'draw')}
                  className={`relative py-2 rounded-lg border-2 transition-all font-condensed overflow-hidden ${userVote === 'draw'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                    } ${(!canVote && !isEditingVote) ? 'opacity-60 cursor-not-allowed' : ''} ${isEditingVote && userVote !== 'draw' ? 'hover:border-green-400 hover:bg-green-50/50 cursor-pointer opacity-100' : ''}`}
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
                  onClick={() => isEditingVote ? handleEditVote('away') : handleVote('away')}
                  disabled={(!canVote && !isEditingVote) || isSubmittingVote || (isEditingVote && userVote === 'away')}
                  className={`relative py-2 rounded-lg border-2 transition-all font-condensed overflow-hidden ${userVote === 'away'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                    } ${(!canVote && !isEditingVote) ? 'opacity-60 cursor-not-allowed' : ''} ${isEditingVote && userVote !== 'away' ? 'hover:border-green-400 hover:bg-green-50/50 cursor-pointer opacity-100' : ''}`}
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

              {/* Edit/Cancel buttons - Show when user has voted and match not started */}
              {hasVoted && canEdit && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  {!isEditingVote ? (
                    <>
                      <button
                        onClick={() => setIsEditingVote(true)}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors font-condensed flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Ubah Pilihan
                      </button>
                      <button
                        onClick={handleCancelVote}
                        disabled={isDeleting}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-condensed flex items-center gap-1"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                        Batalkan
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditingVote(false)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-condensed"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>
              )}

              {/* Edit mode instruction */}
              {isEditingVote && (
                <p className="text-[10px] text-blue-600 mt-2 text-center font-condensed">
                  👆 Klik pilihan baru untuk mengubah vote
                </p>
              )}

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

              {hasScorePrediction && !isEditingScore ? (
                /* Show submitted prediction with Edit/Cancel buttons */
                <div>
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

                  {/* Edit/Cancel buttons for Score */}
                  {canEdit && (
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <button
                        onClick={() => setIsEditingScore(true)}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors font-condensed flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Ubah Skor
                      </button>
                      <button
                        onClick={handleCancelScore}
                        disabled={isDeleting}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-condensed flex items-center gap-1"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                        Batalkan
                      </button>
                    </div>
                  )}
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
                      <p className="text-[10px] text-gray-700 font-condensed font-medium truncate" title={homeTeamName}>{homeTeamShort}</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 mx-auto mb-1">
                        {match?.away_team_logo ? (
                          <img src={match.away_team_logo} alt="" className="w-10 h-10 object-contain" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-700 font-condensed font-medium truncate" title={awayTeamName}>{awayTeamShort}</p>
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
                      disabled={!canPredictScore && !isEditingScore}
                      className={`w-12 h-12 text-center border-2 rounded-lg text-lg font-bold transition-colors ${scorePrediction.home !== ''
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200'
                        } ${(!canPredictScore && !isEditingScore) ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                    <span className="text-lg text-gray-400 font-bold">:</span>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      placeholder="0"
                      value={scorePrediction.away}
                      onChange={(e) => setScorePrediction(prev => ({ ...prev, away: e.target.value }))}
                      disabled={!canPredictScore && !isEditingScore}
                      className={`w-12 h-12 text-center border-2 rounded-lg text-lg font-bold transition-colors ${scorePrediction.away !== ''
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200'
                        } ${(!canPredictScore && !isEditingScore) ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                  </div>

                  {/* Submit Button - for new prediction */}
                  {canPredictScore && !isEditingScore && scorePrediction.home !== '' && scorePrediction.away !== '' && (
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

                  {/* Edit Mode Buttons */}
                  {isEditingScore && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleEditScore}
                        disabled={isSubmittingScore || scorePrediction.home === '' || scorePrediction.away === ''}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors font-condensed text-xs flex items-center justify-center gap-1"
                      >
                        {isSubmittingScore ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3" />
                            Simpan Perubahan
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setIsEditingScore(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors font-condensed text-xs"
                      >
                        Batal
                      </button>
                    </div>
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
