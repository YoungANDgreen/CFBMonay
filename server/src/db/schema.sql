-- ============================================================
-- GridIron IQ -- PostgreSQL Database Schema
-- Full schema with ENUMs, tables, indexes, and triggers.
-- Run against a fresh database:  psql -d gridiron_iq -f schema.sql
-- ============================================================

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE achievement_category AS ENUM (
    'games',
    'prediction',
    'fantasy',
    'social',
    'streak'
);

CREATE TYPE achievement_rarity AS ENUM (
    'common',
    'uncommon',
    'rare',
    'legendary'
);

CREATE TYPE friendship_status AS ENUM (
    'pending',
    'accepted',
    'declined',
    'blocked'
);

CREATE TYPE fantasy_league_status AS ENUM (
    'pre_draft',
    'drafting',
    'in_season',
    'playoffs',
    'complete'
);

CREATE TYPE roster_acquired_via AS ENUM (
    'draft',
    'trade',
    'waivers',
    'free_agent'
);

CREATE TYPE trade_status AS ENUM (
    'pending',
    'accepted',
    'rejected',
    'vetoed'
);

CREATE TYPE chat_room_type AS ENUM (
    'direct',
    'group',
    'league',
    'global'
);

-- ============================================================
-- TRIGGER FUNCTION: auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. users
-- ============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(50)  UNIQUE NOT NULL,
    display_name    VARCHAR(100),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255),
    avatar_url      TEXT,
    favorite_team   VARCHAR(100),
    favorite_conference VARCHAR(50),
    elo_rating      INT          NOT NULL DEFAULT 1200,
    streak_current  INT          NOT NULL DEFAULT 0,
    streak_best     INT          NOT NULL DEFAULT 0,
    is_guest        BOOLEAN      NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_users_username     ON users (username);
CREATE INDEX idx_users_email        ON users (email);
CREATE INDEX idx_users_elo_rating   ON users (elo_rating DESC);
CREATE INDEX idx_users_created_at   ON users (created_at);

-- ============================================================
-- 2. user_stats
-- ============================================================

CREATE TABLE user_stats (
    user_id                   UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    grid_games_played         INT     NOT NULL DEFAULT 0,
    grid_best_score           INT     NOT NULL DEFAULT 0,
    stat_stack_games_played   INT     NOT NULL DEFAULT 0,
    stat_stack_best_percentile INT    NOT NULL DEFAULT 0,
    prediction_accuracy       DECIMAL(5,2) NOT NULL DEFAULT 0,
    fantasy_championships     INT     NOT NULL DEFAULT 0,
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_user_stats_updated_at
    BEFORE UPDATE ON user_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3. achievements
-- ============================================================

CREATE TABLE achievements (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100)         NOT NULL,
    description TEXT                 NOT NULL,
    icon        VARCHAR(10),
    category    achievement_category NOT NULL,
    requirement INT                  NOT NULL DEFAULT 1,
    rarity      achievement_rarity   NOT NULL DEFAULT 'common'
);

CREATE INDEX idx_achievements_category ON achievements (category);
CREATE INDEX idx_achievements_rarity   ON achievements (rarity);

-- ============================================================
-- 4. user_achievements
-- ============================================================

CREATE TABLE user_achievements (
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    progress       INT          NOT NULL DEFAULT 0,
    is_complete    BOOLEAN      NOT NULL DEFAULT false,
    unlocked_at    TIMESTAMPTZ,
    PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user    ON user_achievements (user_id);
CREATE INDEX idx_user_achievements_complete ON user_achievements (is_complete) WHERE is_complete = true;

-- ============================================================
-- 5. friendships
-- ============================================================

CREATE TABLE friendships (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status     friendship_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, friend_id),
    CHECK (user_id <> friend_id)
);

CREATE INDEX idx_friendships_user_id   ON friendships (user_id);
CREATE INDEX idx_friendships_friend_id ON friendships (friend_id);
CREATE INDEX idx_friendships_status    ON friendships (status);

-- ============================================================
-- 6. notifications
-- ============================================================

CREATE TABLE notifications (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       VARCHAR(50)  NOT NULL,
    title      VARCHAR(255) NOT NULL,
    body       TEXT,
    data       JSONB,
    read       BOOLEAN      NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id    ON notifications (user_id);
CREATE INDEX idx_notifications_created_at ON notifications (created_at DESC);
CREATE INDEX idx_notifications_unread     ON notifications (user_id, read) WHERE read = false;

-- ============================================================
-- 7. fantasy_leagues
-- ============================================================

CREATE TABLE fantasy_leagues (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             VARCHAR(100)        NOT NULL,
    commissioner_id  UUID                NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    max_teams        INT                 NOT NULL DEFAULT 12,
    draft_type       VARCHAR(30)         NOT NULL DEFAULT 'snake',
    scoring_type     VARCHAR(30)         NOT NULL DEFAULT 'ppr',
    status           fantasy_league_status NOT NULL DEFAULT 'pre_draft',
    season_year      INT                 NOT NULL,
    created_at       TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fantasy_leagues_commissioner ON fantasy_leagues (commissioner_id);
CREATE INDEX idx_fantasy_leagues_status       ON fantasy_leagues (status);
CREATE INDEX idx_fantasy_leagues_season       ON fantasy_leagues (season_year);

-- ============================================================
-- 8. fantasy_teams
-- ============================================================

CREATE TABLE fantasy_teams (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id       UUID         NOT NULL REFERENCES fantasy_leagues(id) ON DELETE CASCADE,
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_name       VARCHAR(100) NOT NULL,
    wins            INT          NOT NULL DEFAULT 0,
    losses          INT          NOT NULL DEFAULT 0,
    ties            INT          NOT NULL DEFAULT 0,
    points_for      DECIMAL(10,2) NOT NULL DEFAULT 0,
    points_against  DECIMAL(10,2) NOT NULL DEFAULT 0,
    waiver_budget   INT          NOT NULL DEFAULT 100,
    draft_position  INT,
    UNIQUE (league_id, user_id)
);

CREATE INDEX idx_fantasy_teams_league ON fantasy_teams (league_id);
CREATE INDEX idx_fantasy_teams_user   ON fantasy_teams (user_id);

-- ============================================================
-- 9. fantasy_rosters
-- ============================================================

CREATE TABLE fantasy_rosters (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id      UUID            NOT NULL REFERENCES fantasy_teams(id) ON DELETE CASCADE,
    player_id    VARCHAR(50)     NOT NULL,
    player_name  VARCHAR(150)    NOT NULL,
    position     VARCHAR(10)     NOT NULL,
    is_starter   BOOLEAN         NOT NULL DEFAULT false,
    roster_slot  VARCHAR(20),
    acquired_via roster_acquired_via NOT NULL DEFAULT 'free_agent'
);

CREATE INDEX idx_fantasy_rosters_team      ON fantasy_rosters (team_id);
CREATE INDEX idx_fantasy_rosters_player    ON fantasy_rosters (player_id);

-- ============================================================
-- 10. fantasy_matchups
-- ============================================================

CREATE TABLE fantasy_matchups (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id     UUID         NOT NULL REFERENCES fantasy_leagues(id) ON DELETE CASCADE,
    week          INT          NOT NULL,
    home_team_id  UUID         NOT NULL REFERENCES fantasy_teams(id) ON DELETE CASCADE,
    away_team_id  UUID         NOT NULL REFERENCES fantasy_teams(id) ON DELETE CASCADE,
    home_score    DECIMAL(10,2),
    away_score    DECIMAL(10,2),
    is_final      BOOLEAN      NOT NULL DEFAULT false,
    CHECK (home_team_id <> away_team_id)
);

CREATE INDEX idx_fantasy_matchups_league ON fantasy_matchups (league_id);
CREATE INDEX idx_fantasy_matchups_week   ON fantasy_matchups (league_id, week);
CREATE INDEX idx_fantasy_matchups_home   ON fantasy_matchups (home_team_id);
CREATE INDEX idx_fantasy_matchups_away   ON fantasy_matchups (away_team_id);

-- ============================================================
-- 11. trade_proposals
-- ============================================================

CREATE TABLE trade_proposals (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id         UUID         NOT NULL REFERENCES fantasy_leagues(id) ON DELETE CASCADE,
    proposer_team_id  UUID         NOT NULL REFERENCES fantasy_teams(id) ON DELETE CASCADE,
    receiver_team_id  UUID         NOT NULL REFERENCES fantasy_teams(id) ON DELETE CASCADE,
    status            trade_status NOT NULL DEFAULT 'pending',
    players_offered   TEXT[]       NOT NULL DEFAULT '{}',
    players_requested TEXT[]       NOT NULL DEFAULT '{}',
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    resolved_at       TIMESTAMPTZ,
    CHECK (proposer_team_id <> receiver_team_id)
);

CREATE INDEX idx_trade_proposals_league   ON trade_proposals (league_id);
CREATE INDEX idx_trade_proposals_proposer ON trade_proposals (proposer_team_id);
CREATE INDEX idx_trade_proposals_receiver ON trade_proposals (receiver_team_id);
CREATE INDEX idx_trade_proposals_status   ON trade_proposals (status);

-- ============================================================
-- 12. draft_picks
-- ============================================================

CREATE TABLE draft_picks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id   UUID        NOT NULL REFERENCES fantasy_leagues(id) ON DELETE CASCADE,
    team_id     UUID        NOT NULL REFERENCES fantasy_teams(id) ON DELETE CASCADE,
    player_id   VARCHAR(50) NOT NULL,
    player_name VARCHAR(150) NOT NULL,
    position    VARCHAR(10) NOT NULL,
    round       INT         NOT NULL,
    pick_number INT         NOT NULL,
    picked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_draft_picks_league ON draft_picks (league_id);
CREATE INDEX idx_draft_picks_team   ON draft_picks (team_id);
CREATE INDEX idx_draft_picks_order  ON draft_picks (league_id, pick_number);

-- ============================================================
-- 13. prediction_weeks
-- ============================================================

CREATE TABLE prediction_weeks (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_number       INT     NOT NULL,
    season_year       INT     NOT NULL,
    is_locked         BOOLEAN NOT NULL DEFAULT false,
    results_available BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (week_number, season_year)
);

CREATE INDEX idx_prediction_weeks_season ON prediction_weeks (season_year);

-- ============================================================
-- 14. game_predictions  (ML model predictions)
-- ============================================================

CREATE TABLE game_predictions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_id             UUID          NOT NULL REFERENCES prediction_weeks(id) ON DELETE CASCADE,
    game_id             VARCHAR(50)   NOT NULL,
    home_team           VARCHAR(100)  NOT NULL,
    away_team           VARCHAR(100)  NOT NULL,
    predicted_spread    DECIMAL(5,2),
    favored_team        VARCHAR(100),
    spread_confidence   DECIMAL(5,4),
    predicted_total     DECIMAL(6,2),
    total_confidence    DECIMAL(5,4),
    upset_probability   DECIMAL(5,4),
    top_factors         JSONB
);

CREATE INDEX idx_game_predictions_week    ON game_predictions (week_id);
CREATE INDEX idx_game_predictions_game    ON game_predictions (game_id);

-- ============================================================
-- 15. user_predictions
-- ============================================================

CREATE TABLE user_predictions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_id         UUID         NOT NULL REFERENCES prediction_weeks(id) ON DELETE CASCADE,
    game_id         VARCHAR(50)  NOT NULL,
    prediction_type VARCHAR(30)  NOT NULL,
    predicted_value VARCHAR(100) NOT NULL,
    points_earned   INT          DEFAULT 0,
    is_correct      BOOLEAN,
    UNIQUE (user_id, week_id, game_id, prediction_type)
);

CREATE INDEX idx_user_predictions_user ON user_predictions (user_id);
CREATE INDEX idx_user_predictions_week ON user_predictions (week_id);

-- ============================================================
-- 16. game_results
-- ============================================================

CREATE TABLE game_results (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_id    UUID        NOT NULL REFERENCES prediction_weeks(id) ON DELETE CASCADE,
    game_id    VARCHAR(50) UNIQUE NOT NULL,
    home_score INT         NOT NULL,
    away_score INT         NOT NULL,
    winner     VARCHAR(100) NOT NULL
);

CREATE INDEX idx_game_results_week ON game_results (week_id);

-- ============================================================
-- 17. chat_rooms
-- ============================================================

CREATE TABLE chat_rooms (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(100),
    type       chat_room_type NOT NULL DEFAULT 'direct',
    created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_rooms_type ON chat_rooms (type);

-- ============================================================
-- 18. chat_room_members
-- ============================================================

CREATE TABLE chat_room_members (
    room_id   UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (room_id, user_id)
);

CREATE INDEX idx_chat_room_members_user ON chat_room_members (user_id);

-- ============================================================
-- 19. chat_messages
-- ============================================================

CREATE TABLE chat_messages (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id    UUID        NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content    TEXT        NOT NULL,
    type       VARCHAR(20) NOT NULL DEFAULT 'text',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_room       ON chat_messages (room_id);
CREATE INDEX idx_chat_messages_sender     ON chat_messages (sender_id);
CREATE INDEX idx_chat_messages_room_time  ON chat_messages (room_id, created_at DESC);

-- ============================================================
-- 20. leaderboard_snapshots
-- ============================================================

CREATE TABLE leaderboard_snapshots (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type          VARCHAR(30) NOT NULL,
    timeframe     VARCHAR(20) NOT NULL,
    score         INT         NOT NULL DEFAULT 0,
    rank          INT         NOT NULL DEFAULT 0,
    snapshot_date DATE        NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX idx_leaderboard_snapshots_lookup ON leaderboard_snapshots (type, timeframe, snapshot_date);
CREATE INDEX idx_leaderboard_snapshots_user   ON leaderboard_snapshots (user_id);
CREATE INDEX idx_leaderboard_snapshots_rank   ON leaderboard_snapshots (type, timeframe, snapshot_date, rank);
