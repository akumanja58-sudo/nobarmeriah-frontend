'use client';

export default function MatchEvents({ events, homeTeam, awayTeam, homeTeamId, awayTeamId }) {

  // Parse events from API
  // API format: [{ time: {elapsed, extra}, team: {id, name}, player: {id, name}, assist: {}, type, detail, comments }]

  const getEventIcon = (type, detail) => {
    const typeLC = type?.toLowerCase() || '';
    const detailLC = detail?.toLowerCase() || '';

    if (typeLC === 'goal') {
      if (detailLC === 'own goal') return '🔴';
      if (detailLC === 'penalty') return '🎯';
      return '⚽';
    }
    if (typeLC === 'card') {
      if (detailLC === 'yellow card') return '🟨';
      if (detailLC === 'red card') return '🟥';
      if (detailLC === 'second yellow card') return '🟨🟥';
      return '🟨';
    }
    if (typeLC === 'subst') return '🔄';
    if (typeLC === 'var') return '📺';
    return '•';
  };

  const formatMinute = (time) => {
    if (!time) return '';
    const elapsed = time.elapsed || 0;
    const extra = time.extra;
    if (extra) return `${elapsed}+${extra}'`;
    return `${elapsed}'`;
  };

  // No events available
  if (!events || events.length === 0) {
    return (
      <div className="match-events bg-white rounded-xl shadow-sm p-8 text-center">
        <span className="text-4xl mb-4 block">📋</span>
        <p className="text-gray-500 font-condensed">Belum ada events</p>
        <p className="text-sm text-gray-400 font-condensed mt-1">Events akan muncul saat pertandingan berjalan</p>
      </div>
    );
  }

  // Sort events by time (newest first)
  const sortedEvents = [...events].sort((a, b) => {
    const aTime = (a.time?.elapsed || 0) + (a.time?.extra || 0) / 100;
    const bTime = (b.time?.elapsed || 0) + (b.time?.extra || 0) / 100;
    return bTime - aTime;
  });

  // Group events by half
  const firstHalf = sortedEvents.filter(e => (e.time?.elapsed || 0) <= 45);
  const secondHalf = sortedEvents.filter(e => (e.time?.elapsed || 0) > 45 && (e.time?.elapsed || 0) <= 90);
  const extraTime = sortedEvents.filter(e => (e.time?.elapsed || 0) > 90);

  const renderEvent = (event, index) => {
    const isHome = event.team?.id === homeTeamId;
    const isGoal = event.type?.toLowerCase() === 'goal';
    const isCard = event.type?.toLowerCase() === 'card';
    const isSubst = event.type?.toLowerCase() === 'subst';

    return (
      <div
        key={index}
        className={`flex items-center py-2.5 px-3 rounded-lg transition-colors ${isGoal ? 'bg-green-50' : 'hover:bg-gray-50'
          } ${isHome ? '' : 'flex-row-reverse'}`}
      >
        {/* Time */}
        <div className={`w-14 flex-shrink-0 ${isHome ? 'text-left' : 'text-right'}`}>
          <span className={`text-sm font-bold font-condensed ${isGoal ? 'text-green-600' : 'text-gray-500'}`}>
            {formatMinute(event.time)}
          </span>
        </div>

        {/* Icon */}
        <div className="w-8 flex-shrink-0 text-center text-lg">
          {getEventIcon(event.type, event.detail)}
        </div>

        {/* Event Details */}
        <div className={`flex-1 min-w-0 ${isHome ? 'text-left' : 'text-right'}`}>
          <div className="flex items-center gap-1 flex-wrap" style={{ justifyContent: isHome ? 'flex-start' : 'flex-end' }}>
            {isSubst ? (
              <>
                <span className="text-sm font-medium text-green-600 font-condensed">
                  ↑ {event.assist?.name || 'In'}
                </span>
                <span className="text-sm text-gray-400 font-condensed mx-1">|</span>
                <span className="text-sm text-red-500 font-condensed">
                  ↓ {event.player?.name || 'Out'}
                </span>
              </>
            ) : (
              <>
                <span className={`text-sm font-medium font-condensed ${isGoal ? 'text-green-700 font-bold' : 'text-gray-800'}`}>
                  {event.player?.name || 'Player'}
                </span>
                {event.assist?.name && isGoal && (
                  <span className="text-xs text-gray-500 font-condensed">
                    (assist: {event.assist.name})
                  </span>
                )}
              </>
            )}
          </div>

          {/* Detail */}
          {event.detail && !isSubst && (
            <p className={`text-xs text-gray-500 font-condensed ${isHome ? '' : 'text-right'}`}>
              {event.detail}
            </p>
          )}

          {/* Comments */}
          {event.comments && (
            <p className={`text-xs text-gray-400 font-condensed ${isHome ? '' : 'text-right'}`}>
              {event.comments}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="match-events bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4 font-condensed">Match Events</h3>

        {/* Team Headers */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded-full"></div>
            <span className="font-medium text-gray-800 font-condensed">{homeTeam || 'Home'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800 font-condensed">{awayTeam || 'Away'}</span>
            <div className="w-6 h-6 bg-red-500 rounded-full"></div>
          </div>
        </div>

        {/* Extra Time */}
        {extraTime.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-center py-2">
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-condensed">
                Extra Time
              </span>
            </div>
            <div className="space-y-1">
              {extraTime.map((event, index) => renderEvent(event, `et-${index}`))}
            </div>
          </div>
        )}

        {/* Second Half */}
        {secondHalf.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-center py-2">
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-condensed">
                Babak Kedua
              </span>
            </div>
            <div className="space-y-1">
              {secondHalf.map((event, index) => renderEvent(event, `2h-${index}`))}
            </div>
          </div>
        )}

        {/* Half Time Separator */}
        <div className="flex items-center justify-center py-3">
          <div className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-full">
            <span className="text-sm font-medium text-gray-600 font-condensed">⏱️ HT</span>
          </div>
        </div>

        {/* First Half */}
        {firstHalf.length > 0 && (
          <div>
            <div className="flex items-center justify-center py-2">
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-condensed">
                Babak Pertama
              </span>
            </div>
            <div className="space-y-1">
              {firstHalf.map((event, index) => renderEvent(event, `1h-${index}`))}
            </div>
          </div>
        )}

        {/* Kick Off */}
        <div className="flex items-center justify-center py-3 mt-2">
          <span className="text-xs font-medium text-gray-400 font-condensed">⚽ Kick Off</span>
        </div>
      </div>
    </div>
  );
}
