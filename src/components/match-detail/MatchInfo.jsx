'use client';

export default function MatchInfo({ match }) {

  const formatMatchDate = () => {
    const kickoff = match?.date || match?.kickoff || match?.timestamp;
    if (!kickoff) return '-';

    const date = new Date(kickoff);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) + ' pukul ' + date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="match-info bg-white rounded-xl shadow-sm p-4">
      {/* Date & Time */}
      <div className="mb-4 pb-4 border-b border-gray-100">
        <p className="text-xs text-gray-500 mb-1 font-condensed">Tanggal dan waktu</p>
        <p className="text-sm font-semibold text-gray-800 font-condensed">
          📅 {formatMatchDate()}
        </p>
      </div>

      {/* Competition */}
      <div className="mb-4 pb-4 border-b border-gray-100">
        <p className="text-xs text-gray-500 mb-1 font-condensed">Kompetisi</p>
        <div className="flex items-center gap-2">
          {match?.league_logo ? (
            <img src={match.league_logo} alt="" className="w-5 h-5 object-contain" />
          ) : (
            <span className="text-sm">🏆</span>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-800 font-condensed">
              {match?.league_name || match?.league || 'Football'}
            </p>
            {(match?.league_round || match?.round) && (
              <p className="text-xs text-gray-500 font-condensed">{match?.league_round || match?.round}</p>
            )}
          </div>
        </div>
      </div>

      {/* Venue */}
      <div className="mb-4 pb-4 border-b border-gray-100">
        <p className="text-xs text-gray-500 mb-1 font-condensed">Venue</p>
        <p className="text-sm font-semibold text-gray-800 font-condensed">
          🏟️ {match?.venue || 'Stadium'}
        </p>
      </div>

      {/* Location */}
      <div className="mb-4 pb-4 border-b border-gray-100">
        <p className="text-xs text-gray-500 mb-1 font-condensed">Lokasi</p>
        <p className="text-sm font-semibold text-gray-800 flex items-center gap-2 font-condensed">
          <span>📍</span>
          {match?.venue_city || match?.city || 'City'}, {match?.league_country || match?.country || 'Country'}
        </p>
      </div>

      {/* Referee */}
      {match?.referee && (
        <div className="pb-4 border-b border-gray-100">
          <p className="text-xs text-gray-500 mb-1 font-condensed">Wasit</p>
          <div className="flex items-center gap-2">
            <span>🧑‍⚖️</span>
            <p className="text-sm font-semibold text-gray-800 font-condensed">
              {match.referee}
            </p>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="text-xs text-gray-400 text-center pt-4 font-condensed">
        Taruhan dengan tanggung jawab usia 18+
      </div>
    </div>
  );
}
