-- database_schema.sql - Complete Database Schema for Auto Football System
-- Following via NobarMeriah Flow: Seasons → Countries → Leagues → Fixtures → Live/Players/Teams

-- ============= TRACKED LEAGUES TABLE =============
CREATE TABLE IF NOT EXISTS tracked_leagues (
    id BIGSERIAL PRIMARY KEY,
    league_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    season INTEGER NOT NULL DEFAULT 2025,
    region VARCHAR(100),
    tier INTEGER DEFAULT 3,
    priority INTEGER DEFAULT 3,
    sync_interval INTEGER DEFAULT 30, -- minutes
    daily_quota INTEGER DEFAULT 10,
    auto_enable BOOLEAN DEFAULT true,
    seasonal BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tracked_leagues_active ON tracked_leagues(is_active);
CREATE INDEX IF NOT EXISTS idx_tracked_leagues_priority ON tracked_leagues(priority);
CREATE INDEX IF NOT EXISTS idx_tracked_leagues_tier ON tracked_leagues(tier);

-- ============= ENHANCED MATCHES TABLE =============
-- Extend existing matches table or create new one
DO $$ 
BEGIN
    -- Check if matches table exists, if not create it
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'matches') THEN
        CREATE TABLE matches (
            id BIGSERIAL PRIMARY KEY,
            home_team VARCHAR(255) NOT NULL,
            away_team VARCHAR(255) NOT NULL,
            kickoff TIMESTAMP WITH TIME ZONE NOT NULL,
            status VARCHAR(50) DEFAULT 'upcoming',
            home_score INTEGER,
            away_score INTEGER,
            league VARCHAR(255),
            is_hot BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Add new columns to existing matches table
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS api_fixture_id INTEGER UNIQUE,
ADD COLUMN IF NOT EXISTS home_team_id INTEGER,
ADD COLUMN IF NOT EXISTS away_team_id INTEGER,
ADD COLUMN IF NOT EXISTS league_id INTEGER,
ADD COLUMN IF NOT EXISTS league_season INTEGER,
ADD COLUMN IF NOT EXISTS league_round VARCHAR(255),
ADD COLUMN IF NOT EXISTS venue_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS venue_city VARCHAR(255),
ADD COLUMN IF NOT EXISTS venue_id INTEGER,
ADD COLUMN IF NOT EXISTS referee VARCHAR(255),
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50),
ADD COLUMN IF NOT EXISTS elapsed_time INTEGER,
ADD COLUMN IF NOT EXISTS extra_time INTEGER,
ADD COLUMN IF NOT EXISTS fetch_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sync_source VARCHAR(50) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS league_priority INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS league_tier INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_matches_api_fixture_id ON matches(api_fixture_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_kickoff ON matches(kickoff);
CREATE INDEX IF NOT EXISTS idx_matches_league_id ON matches(league_id);
CREATE INDEX IF NOT EXISTS idx_matches_home_team_id ON matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team_id ON matches(away_team_id);

-- ============= TEAMS TABLE =============
CREATE TABLE IF NOT EXISTS teams (
    id BIGSERIAL PRIMARY KEY,
    api_team_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10),
    country VARCHAR(100),
    founded INTEGER,
    logo TEXT,
    league_id INTEGER,
    
    -- Venue information
    venue_name VARCHAR(255),
    venue_address TEXT,
    venue_city VARCHAR(100),
    venue_capacity INTEGER,
    venue_surface VARCHAR(50),
    venue_image TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_api_id ON teams(api_team_id);
CREATE INDEX IF NOT EXISTS idx_teams_league_id ON teams(league_id);
CREATE INDEX IF NOT EXISTS idx_teams_country ON teams(country);

-- ============= PLAYERS TABLE =============
CREATE TABLE IF NOT EXISTS players (
    id BIGSERIAL PRIMARY KEY,
    api_player_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    firstname VARCHAR(255),
    lastname VARCHAR(255),
    age INTEGER,
    birth_date DATE,
    birth_place VARCHAR(255),
    birth_country VARCHAR(100),
    nationality VARCHAR(100),
    height VARCHAR(20),
    weight VARCHAR(20),
    injured BOOLEAN DEFAULT false,
    photo TEXT,
    
    -- Team and position
    team_id INTEGER,
    position VARCHAR(50),
    number INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_api_id ON players(api_player_id);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_position ON players(position);

-- ============= STANDINGS TABLE =============
CREATE TABLE IF NOT EXISTS standings (
    id BIGSERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL,
    season INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    team_name VARCHAR(255) NOT NULL,
    team_logo TEXT,
    
    -- Position and points
    rank INTEGER NOT NULL,
    points INTEGER DEFAULT 0,
    goals_diff INTEGER DEFAULT 0,
    group_name VARCHAR(50),
    form VARCHAR(10),
    status VARCHAR(50),
    description TEXT,
    
    -- Games statistics
    games_played INTEGER DEFAULT 0,
    games_win INTEGER DEFAULT 0,
    games_draw INTEGER DEFAULT 0,
    games_lose INTEGER DEFAULT 0,
    
    -- Goals
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    
    -- Home statistics
    home_played INTEGER DEFAULT 0,
    home_win INTEGER DEFAULT 0,
    home_draw INTEGER DEFAULT 0,
    home_lose INTEGER DEFAULT 0,
    home_goals_for INTEGER DEFAULT 0,
    home_goals_against INTEGER DEFAULT 0,
    
    -- Away statistics
    away_played INTEGER DEFAULT 0,
    away_win INTEGER DEFAULT 0,
    away_draw INTEGER DEFAULT 0,
    away_lose INTEGER DEFAULT 0,
    away_goals_for INTEGER DEFAULT 0,
    away_goals_against INTEGER DEFAULT 0,
    
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(league_id, season, team_id)
);

CREATE INDEX IF NOT EXISTS idx_standings_league_season ON standings(league_id, season);
CREATE INDEX IF NOT EXISTS idx_standings_rank ON standings(rank);

-- ============= MATCH STATISTICS TABLE =============
CREATE TABLE IF NOT EXISTS match_statistics (
    id BIGSERIAL PRIMARY KEY,
    api_fixture_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    team_name VARCHAR(255) NOT NULL,
    
    -- Statistics data (stored as JSONB for flexibility)
    statistics JSONB,
    
    -- Common statistics (for easier querying)
    shots_on_goal INTEGER,
    shots_off_goal INTEGER,
    total_shots INTEGER,
    blocked_shots INTEGER,
    shots_inside_box INTEGER,
    shots_outside_box INTEGER,
    fouls INTEGER,
    corner_kicks INTEGER,
    offside INTEGER,
    ball_possession INTEGER,
    yellow_cards INTEGER,
    red_cards INTEGER,
    goalkeeper_saves INTEGER,
    total_passes INTEGER,
    passes_accurate INTEGER,
    passes_percent INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_stats_fixture_id ON match_statistics(api_fixture_id);
CREATE INDEX IF NOT EXISTS idx_match_stats_team_id ON match_statistics(team_id);

-- ============= MATCH EVENTS TABLE =============
CREATE TABLE IF NOT EXISTS match_events (
    id BIGSERIAL PRIMARY KEY,
    api_fixture_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    team_name VARCHAR(255) NOT NULL,
    
    -- Event details
    event_time INTEGER NOT NULL, -- minute
    extra_time INTEGER,
    event_type VARCHAR(50) NOT NULL, -- Goal, Card, Substitution, etc.
    event_detail VARCHAR(100), -- Yellow Card, Red Card, Normal Goal, etc.
    
    -- Player information
    player_id INTEGER,
    player_name VARCHAR(255),
    assist_id INTEGER,
    assist_name VARCHAR(255),
    
    -- Additional data
    comments TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_events_fixture_id ON match_events(api_fixture_id);
CREATE INDEX IF NOT EXISTS idx_match_events_type ON match_events(event_type);
CREATE INDEX IF NOT EXISTS idx_match_events_player_id ON match_events(player_id);

-- ============= LINEUPS TABLE =============
CREATE TABLE IF NOT EXISTS lineups (
    id BIGSERIAL PRIMARY KEY,
    api_fixture_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    team_name VARCHAR(255) NOT NULL,
    
    -- Formation
    formation VARCHAR(20),
    
    -- Coach information
    coach_id INTEGER,
    coach_name VARCHAR(255),
    coach_photo TEXT,
    
    -- Lineup data (stored as JSONB)
    startxi JSONB, -- Starting XI
    substitutes JSONB, -- Substitutes
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lineups_fixture_id ON lineups(api_fixture_id);
CREATE INDEX IF NOT EXISTS idx_lineups_team_id ON lineups(team_id);

-- ============= PLAYER STATISTICS TABLE =============
CREATE TABLE IF NOT EXISTS player_statistics (
    id BIGSERIAL PRIMARY KEY,
    api_fixture_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    player_name VARCHAR(255) NOT NULL,
    team_id INTEGER NOT NULL,
    
    -- Game statistics
    minutes_played INTEGER,
    position VARCHAR(50),
    rating DECIMAL(3,1),
    captain BOOLEAN DEFAULT false,
    substitute BOOLEAN DEFAULT false,
    
    -- Offensive stats
    shots_total INTEGER DEFAULT 0,
    shots_on INTEGER DEFAULT 0,
    goals_total INTEGER DEFAULT 0,
    goals_conceded INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    
    -- Passing stats
    passes_total INTEGER DEFAULT 0,
    passes_key INTEGER DEFAULT 0,
    passes_accuracy INTEGER DEFAULT 0,
    
    -- Defensive stats
    tackles_total INTEGER DEFAULT 0,
    tackles_blocks INTEGER DEFAULT 0,
    tackles_interceptions INTEGER DEFAULT 0,
    
    -- Disciplinary
    cards_yellow INTEGER DEFAULT 0,
    cards_red INTEGER DEFAULT 0,
    
    -- Dribbling
    dribbles_attempts INTEGER DEFAULT 0,
    dribbles_success INTEGER DEFAULT 0,
    dribbles_past INTEGER DEFAULT 0,
    
    -- Duels
    duels_total INTEGER DEFAULT 0,
    duels_won INTEGER DEFAULT 0,
    
    -- Fouls
    fouls_drawn INTEGER DEFAULT 0,
    fouls_committed INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_stats_fixture_id ON player_statistics(api_fixture_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_player_id ON player_statistics(player_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_team_id ON player_statistics(team_id);

-- ============= ODDS TABLE =============
CREATE TABLE IF NOT EXISTS odds (
    id BIGSERIAL PRIMARY KEY,
    api_fixture_id INTEGER NOT NULL,
    bookmaker_id INTEGER NOT NULL,
    bookmaker_name VARCHAR(255) NOT NULL,
    
    -- Bet information
    bet_id INTEGER NOT NULL,
    bet_name VARCHAR(255) NOT NULL,
    
    -- Odds values (stored as JSONB for flexibility)
    values JSONB NOT NULL,
    
    -- Update tracking
    is_live BOOLEAN DEFAULT false,
    update_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_odds_fixture_id ON odds(api_fixture_id);
CREATE INDEX IF NOT EXISTS idx_odds_bookmaker_id ON odds(bookmaker_id);
CREATE INDEX IF NOT EXISTS idx_odds_is_live ON odds(is_live);

-- ============= VENUES TABLE =============
CREATE TABLE IF NOT EXISTS venues (
    id BIGSERIAL PRIMARY KEY,
    api_venue_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    capacity INTEGER,
    surface VARCHAR(50),
    image TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_venues_api_id ON venues(api_venue_id);
CREATE INDEX IF NOT EXISTS idx_venues_city ON venues(city);
CREATE INDEX IF NOT EXISTS idx_venues_country ON venues(country);

-- ============= INJURIES TABLE =============
CREATE TABLE IF NOT EXISTS injuries (
    id BIGSERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL,
    player_name VARCHAR(255) NOT NULL,
    player_photo TEXT,
    team_id INTEGER NOT NULL,
    team_name VARCHAR(255) NOT NULL,
    team_logo TEXT,
    league_id INTEGER NOT NULL,
    league_season INTEGER NOT NULL,
    
    -- Injury details
    injury_type VARCHAR(255),
    injury_reason VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_injuries_player_id ON injuries(player_id);
CREATE INDEX IF NOT EXISTS idx_injuries_team_id ON injuries(team_id);
CREATE INDEX IF NOT EXISTS idx_injuries_league_id ON injuries(league_id);

-- ============= TRANSFERS TABLE =============
CREATE TABLE IF NOT EXISTS transfers (
    id BIGSERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL,
    player_name VARCHAR(255) NOT NULL,
    
    -- Transfer details
    transfer_date DATE,
    transfer_type VARCHAR(50), -- Loan, Free, Transfer, etc.
    
    -- Teams involved
    team_in_id INTEGER,
    team_in_name VARCHAR(255),
    team_in_logo TEXT,
    team_out_id INTEGER,
    team_out_name VARCHAR(255),
    team_out_logo TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfers_player_id ON transfers(player_id);
CREATE INDEX IF NOT EXISTS idx_transfers_team_in ON transfers(team_in_id);
CREATE INDEX IF NOT EXISTS idx_transfers_team_out ON transfers(team_out_id);
CREATE INDEX IF NOT EXISTS idx_transfers_date ON transfers(transfer_date);

-- ============= COACHES TABLE =============
CREATE TABLE IF NOT EXISTS coaches (
    id BIGSERIAL PRIMARY KEY,
    api_coach_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    firstname VARCHAR(255),
    lastname VARCHAR(255),
    age INTEGER,
    birth_date DATE,
    birth_place VARCHAR(255),
    birth_country VARCHAR(100),
    nationality VARCHAR(100),
    height VARCHAR(20),
    weight VARCHAR(20),
    photo TEXT,
    
    -- Current team
    team_id INTEGER,
    team_name VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coaches_api_id ON coaches(api_coach_id);
CREATE INDEX IF NOT EXISTS idx_coaches_team_id ON coaches(team_id);

-- ============= TROPHIES TABLE =============
CREATE TABLE IF NOT EXISTS trophies (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL, -- 'team' or 'player'
    entity_id INTEGER NOT NULL,
    entity_name VARCHAR(255) NOT NULL,
    
    -- Trophy details
    league VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    season VARCHAR(20),
    place VARCHAR(50), -- Winner, Runner-up, etc.
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trophies_entity ON trophies(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_trophies_league ON trophies(league);

-- ============= SIDELINED PLAYERS TABLE =============
CREATE TABLE IF NOT EXISTS sidelined (
    id BIGSERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL,
    player_name VARCHAR(255) NOT NULL,
    player_photo TEXT,
    team_id INTEGER NOT NULL,
    team_name VARCHAR(255) NOT NULL,
    team_logo TEXT,
    
    -- Sidelined details
    type VARCHAR(100) NOT NULL, -- Injury, Suspension, etc.
    start_date DATE,
    end_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sidelined_player_id ON sidelined(player_id);
CREATE INDEX IF NOT EXISTS idx_sidelined_team_id ON sidelined(team_id);
CREATE INDEX IF NOT EXISTS idx_sidelined_type ON sidelined(type);

-- ============= SYSTEM MONITORING TABLES =============

-- System logs for monitoring
CREATE TABLE IF NOT EXISTS system_logs (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    level VARCHAR(20) NOT NULL DEFAULT 'info', -- debug, info, warn, error, critical
    message TEXT NOT NULL,
    details JSONB,
    source VARCHAR(100) DEFAULT 'auto_fixtures_manager',
    
    -- Indexes for performance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_source ON system_logs(source);

-- Notifications for admin panel
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    notification_id VARCHAR(100) UNIQUE NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    priority INTEGER NOT NULL DEFAULT 2,
    data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    source VARCHAR(100) NOT NULL,
    
    -- Status tracking
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp);

-- Admin alerts for real-time notifications
CREATE TABLE IF NOT EXISTS admin_alerts (
    id BIGSERIAL PRIMARY KEY,
    alert_id VARCHAR(100) UNIQUE NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    priority INTEGER NOT NULL DEFAULT 2,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    auto_dismiss BOOLEAN DEFAULT true,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_alerts_active ON admin_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_timestamp ON admin_alerts(timestamp);

-- ============= API USAGE TRACKING =============
CREATE TABLE IF NOT EXISTS api_usage (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    requests_count INTEGER DEFAULT 1,
    league_id INTEGER,
    league_name VARCHAR(255),
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    avg_response_time INTEGER, -- milliseconds
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(date, endpoint, league_id)
);

CREATE INDEX IF NOT EXISTS idx_api_usage_date ON api_usage(date);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_league_id ON api_usage(league_id);

-- ============= FUNCTIONS AND TRIGGERS =============

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ language 'plpgsql';

-- Add triggers for tables that need updated_at
CREATE TRIGGER update_tracked_leagues_updated_at BEFORE UPDATE ON tracked_leagues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_injuries_updated_at BEFORE UPDATE ON injuries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coaches_updated_at BEFORE UPDATE ON coaches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sidelined_updated_at BEFORE UPDATE ON sidelined FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_usage_updated_at BEFORE UPDATE ON api_usage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============= RLS (Row Level Security) POLICIES =============

-- Enable RLS for sensitive tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Policies for admin access (you'll need to adjust based on your auth setup)
CREATE POLICY "Admin can view all notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update notifications" ON notifications FOR UPDATE USING (true);

CREATE POLICY "Admin can view all alerts" ON admin_alerts FOR SELECT USING (true);
CREATE POLICY "System can insert alerts" ON admin_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update alerts" ON admin_alerts FOR UPDATE USING (true);

CREATE POLICY "Admin can view all logs" ON system_logs FOR SELECT USING (true);
CREATE POLICY "System can insert logs" ON system_logs FOR INSERT WITH CHECK (true);

-- ============= INITIAL DATA SETUP =============

-- Insert default tracked leagues
INSERT INTO tracked_leagues (league_id, name, season, region, tier, priority, sync_interval, daily_quota, auto_enable) VALUES
-- Tier 1 - Must have
(39, 'Premier League', 2025, 'England', 1, 1, 5, 20, true),
(140, 'La Liga', 2025, 'Spain', 1, 1, 5, 20, true),
(135, 'Serie A', 2025, 'Italy', 1, 1, 5, 20, true),
(78, 'Bundesliga', 2025, 'Germany', 1, 1, 5, 20, true),
(61, 'Ligue 1', 2025, 'France', 1, 1, 5, 20, true),
(2, 'UEFA Champions League', 2025, 'UEFA', 1, 1, 3, 30, true),
(3, 'UEFA Europa League', 2025, 'UEFA', 1, 1, 5, 15, true),

-- Tier 2 - Popular
(253, 'Major League Soccer', 2025, 'USA', 2, 2, 10, 15, true),
(271, 'Saudi Pro League', 2025, 'Saudi Arabia', 2, 2, 10, 15, true),
(88, 'Eredivisie', 2025, 'Netherlands', 2, 2, 10, 10, true),
(13, 'Copa Libertadores', 2025, 'CONMEBOL', 2, 2, 10, 10, true),
(137, 'Campeonato Brasileiro', 2025, 'Brazil', 2, 2, 10, 15, true)

ON CONFLICT (league_id) DO NOTHING;

-- ============= VIEWS FOR EASY QUERYING =============

-- View for live matches with team details
CREATE OR REPLACE VIEW live_matches_view AS
SELECT 
    m.*,
    ht.name as home_team_full_name,
    ht.logo as home_team_logo,
    at.name as away_team_full_name,
    at.logo as away_team_logo,
    v.name as venue_full_name,
    v.capacity as venue_capacity
FROM matches m
LEFT JOIN teams ht ON m.home_team_id = ht.api_team_id
LEFT JOIN teams at ON m.away_team_id = at.api_team_id
LEFT JOIN venues v ON m.venue_id = v.api_venue_id
WHERE m.status IN ('live', '1H', '2H', 'HT', 'ET', 'BT', 'P');

-- View for upcoming matches
CREATE OR REPLACE VIEW upcoming_matches_view AS
SELECT 
    m.*,
    ht.name as home_team_full_name,
    ht.logo as home_team_logo,
    at.name as away_team_full_name,
    at.logo as away_team_logo,
    v.name as venue_full_name
FROM matches m
LEFT JOIN teams ht ON m.home_team_id = ht.api_team_id
LEFT JOIN teams at ON m.away_team_id = at.api_team_id
LEFT JOIN venues v ON m.venue_id = v.api_venue_id
WHERE m.status = 'upcoming'
AND m.kickoff > NOW()
ORDER BY m.kickoff ASC;

-- View for system health monitoring
CREATE OR REPLACE VIEW system_health_view AS
SELECT 
    (SELECT COUNT(*) FROM matches WHERE status = 'live') as live_matches,
    (SELECT COUNT(*) FROM matches WHERE kickoff::date = CURRENT_DATE) as today_matches,
    (SELECT COUNT(*) FROM tracked_leagues WHERE is_active = true) as active_leagues,
    (SELECT COUNT(*) FROM notifications WHERE is_read = false) as unread_notifications,
    (SELECT COUNT(*) FROM system_logs WHERE timestamp > NOW() - INTERVAL '1 hour' AND level = 'error') as recent_errors,
    (SELECT SUM(requests_count) FROM api_usage WHERE date = CURRENT_DATE) as daily_api_usage;

-- ============= CLEANUP PROCEDURES =============

-- Function to cleanup old data
CREATE OR REPLACE FUNCTION cleanup_old_data() RETURNS void AS $
BEGIN
    -- Delete old finished matches (older than 30 days)
    DELETE FROM matches 
    WHERE status = 'finished' 
    AND kickoff < NOW() - INTERVAL '30 days';
    
    -- Delete old system logs (older than 7 days)
    DELETE FROM system_logs 
    WHERE timestamp < NOW() - INTERVAL '7 days';
    
    -- Delete old dismissed notifications (older than 30 days)
    DELETE FROM notifications 
    WHERE is_dismissed = true 
    AND dismissed_at < NOW() - INTERVAL '30 days';
    
    -- Delete old admin alerts (older than 7 days)
    DELETE FROM admin_alerts 
    WHERE is_active = false 
    AND dismissed_at < NOW() - INTERVAL '7 days';
    
    -- Vacuum tables for performance
    VACUUM ANALYZE matches;
    VACUUM ANALYZE system_logs;
    VACUUM ANALYZE notifications;
    
    RAISE NOTICE 'Cleanup completed successfully';
END;
$ LANGUAGE plpgsql;

-- ============= COMMENTS FOR DOCUMENTATION =============
COMMENT ON TABLE tracked_leagues IS 'Leagues being monitored by the auto fixtures system';
COMMENT ON TABLE matches IS 'Football matches with via NobarMeriah integration';
COMMENT ON TABLE teams IS 'Team information from via NobarMeriah';
COMMENT ON TABLE players IS 'Player information from via NobarMeriah';
COMMENT ON TABLE standings IS 'League standings/table positions';
COMMENT ON TABLE match_statistics IS 'Detailed match statistics';
COMMENT ON TABLE match_events IS 'Match events (goals, cards, substitutions)';
COMMENT ON TABLE lineups IS 'Team lineups for matches';
COMMENT ON TABLE player_statistics IS 'Individual player performance in matches';
COMMENT ON TABLE odds IS 'Betting odds from various bookmakers';
COMMENT ON TABLE venues IS 'Stadium/venue information';
COMMENT ON TABLE injuries IS 'Player injury reports';
COMMENT ON TABLE transfers IS 'Player transfer history';
COMMENT ON TABLE coaches IS 'Coach/manager information';
COMMENT ON TABLE trophies IS 'Trophy/achievement history for teams and players';
COMMENT ON TABLE sidelined IS 'Players unavailable due to injury/suspension';
COMMENT ON TABLE system_logs IS 'System operation logs for monitoring';
COMMENT ON TABLE notifications IS 'Admin panel notifications';
COMMENT ON TABLE admin_alerts IS 'Real-time alerts for administrators';
COMMENT ON TABLE api_usage IS 'API usage tracking and statistics';

-- Final message
DO $
BEGIN
    RAISE NOTICE '🚀 Auto Football System database schema setup completed!';
    RAISE NOTICE '📊 Tables created: 18 main tables + monitoring tables';
    RAISE NOTICE '🔍 Indexes created for optimal performance';
    RAISE NOTICE '🔐 RLS policies configured for security';
    RAISE NOTICE '📈 Views created for easy querying';
    RAISE NOTICE '🧹 Cleanup procedures available';
END $;