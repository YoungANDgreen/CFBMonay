-- ============================================================
-- GridIron IQ -- Seed Data
-- Run after schema.sql:  psql -d gridiron_iq -f seed.sql
-- ============================================================

-- ============================================================
-- 1. Demo Users  (matching auth-service.ts mock users)
-- Using deterministic UUIDs so foreign keys are predictable.
-- ============================================================

INSERT INTO users (id, username, display_name, email, password_hash, favorite_team, favorite_conference, elo_rating, streak_current, streak_best)
VALUES
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa001', 'GridIronKing',  'GridIron King',  'gridironking@gridiron-iq.dev',  '$2b$10$demoHashGridIronKing',  'Alabama',    'SEC',     1650, 42, 42),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa002', 'CFBNerd2025',   'CFB Nerd',       'cfbnerd2025@gridiron-iq.dev',   '$2b$10$demoHashCFBNerd2025',   'Ohio State', 'Big Ten', 1580, 15, 31),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa003', 'PickEmPro',     'Pick Em Pro',    'pickempro@gridiron-iq.dev',     '$2b$10$demoHashPickEmPro',     'Georgia',    'SEC',     1720, 28, 55),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa004', 'DynastyDave',   'Dynasty Dave',   'dynastydave@gridiron-iq.dev',   '$2b$10$demoHashDynastyDave',   'Texas',      'SEC',     1490,  7, 19);

-- ============================================================
-- 2. User Stats  (matching auth-service.ts stats)
-- ============================================================

INSERT INTO user_stats (user_id, grid_games_played, grid_best_score, stat_stack_games_played, stat_stack_best_percentile, prediction_accuracy, fantasy_championships)
VALUES
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa001', 218, 950, 134, 96, 68, 2),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa002', 175, 880,  92, 88, 62, 1),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa003', 102, 820,  67, 79, 74, 3),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa004',  85, 710,  48, 65, 55, 4);

-- ============================================================
-- 3. Achievements  (all 25 from social-service.ts)
-- Deterministic UUIDs: b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb0XX
-- ============================================================

INSERT INTO achievements (id, name, description, icon, category, requirement, rarity) VALUES
    -- Games (8)
    ('b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb001', 'First Blood',       'Play your first game of any type',            '🎮', 'games',      1,   'common'),
    ('b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb002', 'Grid Rookie',       'Complete 10 grid puzzles',                    '🔲', 'games',      10,  'common'),
    ('b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb003', 'Grid Master',       'Complete 100 grid puzzles',                   '🏆', 'games',      100, 'rare'),
    ('b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb004', 'Perfect Grid',      'Score 9/9 on a 3x3 grid puzzle',             '💎', 'games',      1,   'rare'),
    ('b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb005', 'Stat Stacker',      'Complete 50 Stat Stack games',                '📊', 'games',      50,  'uncommon'),
    ('b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb006', 'Dynasty Founder',   'Build your first Dynasty roster',             '🏛️', 'games',      1,   'common'),
    ('b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb007', 'Clash Victor',      'Win 25 Conference Clash matches',             '⚔️', 'games',      25,  'uncommon'),
    ('b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb008', 'All-Rounder',       'Play every game mode at least once',          '🌟', 'games',      5,   'uncommon'),

    -- Prediction (5)
    ('b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb009', 'Oracle',            'Make 10 correct game predictions',            '🔮', 'prediction', 10,  'common'),
    ('b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb010', 'Upset Caller',      'Correctly predict 5 upsets',                  '🫨', 'prediction', 5,   'rare'),
    ('b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb011', 'Beat the Model',    'Outscore the ML model for 3 weeks',           '🤖', 'prediction', 3,   'rare'),
    ('b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb012', 'Sharpshooter',      'Hit the exact spread on 5 games',             '🎯', 'prediction', 5,   'legendary'),
    ('b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb013', 'Season Sage',       'Finish a season in the top 10%',              '🧙', 'prediction', 1,   'rare'),

    -- Fantasy (5)
    ('b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb014', 'Draft Day',         'Complete your first fantasy draft',           '📋', 'fantasy',    1,   'common'),
    ('b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb015', 'Champion',          'Win a fantasy football league',               '🏅', 'fantasy',    1,   'rare'),
    ('b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb016', 'Trade Master',      'Successfully complete 10 trades',             '🤝', 'fantasy',    10,  'uncommon'),
    ('b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb017', 'Waiver Hawk',       'Win 20 waiver claims',                        '🦅', 'fantasy',    20,  'uncommon'),
    ('b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb018', 'Dynasty King',      'Win back-to-back league championships',       '👑', 'fantasy',    2,   'legendary'),

    -- Social (3)
    ('b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb019', 'Social Butterfly',  'Add 10 friends',                              '🦋', 'social',     10,  'common'),
    ('b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb020', 'Chat Champion',     'Send 100 messages in league chat',            '💬', 'social',     100, 'uncommon'),
    ('b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb021', 'Influencer',        'Have 50 friends',                             '📢', 'social',     50,  'rare'),

    -- Streak (4)
    ('b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb022', 'On Fire',           'Maintain a 7-day login streak',               '🔥', 'streak',     7,   'common'),
    ('b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb023', 'Unstoppable',       'Maintain a 30-day login streak',              '⚡', 'streak',     30,  'uncommon'),
    ('b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb024', 'Legend',            'Maintain a 100-day login streak',             '🐐', 'streak',     100, 'legendary'),
    ('b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb025', 'Dedicated',         'Maintain a 14-day login streak',              '💪', 'streak',     14,  'common');

-- ============================================================
-- 4. Sample User Achievements  (GridIronKing progress)
-- ============================================================

INSERT INTO user_achievements (user_id, achievement_id, progress, is_complete, unlocked_at) VALUES
    -- GridIronKing: heavy gamer, strong streak
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa001', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb001', 1,   true,  '2025-09-01 12:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa001', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb002', 10,  true,  '2025-09-20 09:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa001', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb003', 100, true,  '2026-01-15 14:30:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa001', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb004', 1,   true,  '2025-12-10 20:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa001', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb005', 50,  true,  '2026-02-01 11:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa001', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb008', 5,   true,  '2025-11-15 17:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa001', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb009', 10,  true,  '2025-10-20 20:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa001', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb014', 1,   true,  '2025-09-05 19:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa001', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb015', 1,   true,  '2025-12-20 22:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa001', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb022', 7,   true,  '2025-09-08 08:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa001', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb023', 30,  true,  '2025-10-01 08:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa001', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb025', 14,  true,  '2025-09-15 08:00:00+00'),

    -- CFBNerd2025: grid focused, moderate progress
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa002', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb001', 1,   true,  '2025-09-03 10:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa002', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb002', 10,  true,  '2025-10-01 09:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa002', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb003', 100, true,  '2026-02-10 09:15:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa002', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb005', 38,  false, NULL),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa002', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb009', 10,  true,  '2025-11-01 20:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa002', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb022', 7,   true,  '2025-09-10 08:00:00+00'),

    -- PickEmPro: prediction master
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa003', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb001', 1,   true,  '2025-09-02 14:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa003', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb009', 10,  true,  '2025-09-28 20:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa003', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb010', 5,   true,  '2025-11-20 21:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa003', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb011', 3,   true,  '2026-01-05 22:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa003', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb013', 1,   true,  '2026-01-15 22:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa003', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb014', 1,   true,  '2025-09-06 19:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa003', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb015', 1,   true,  '2025-12-22 22:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa003', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb022', 7,   true,  '2025-09-09 08:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa003', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb023', 30,  true,  '2025-10-02 08:00:00+00'),

    -- DynastyDave: fantasy focused
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa004', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb001', 1,   true,  '2025-09-04 16:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa004', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb002', 10,  true,  '2025-11-10 09:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa004', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb006', 1,   true,  '2025-10-01 10:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa004', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb014', 1,   true,  '2025-09-05 19:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa004', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb015', 1,   true,  '2025-12-18 22:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa004', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb016', 10,  true,  '2026-01-20 15:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa004', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb017', 20,  true,  '2026-02-05 12:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa004', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb018', 2,   true,  '2026-01-25 22:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa004', 'b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb022', 7,   true,  '2025-09-11 08:00:00+00');

-- ============================================================
-- 5. Sample Friendships
-- ============================================================

INSERT INTO friendships (user_id, friend_id, status, created_at) VALUES
    -- GridIronKing <-> CFBNerd2025  (accepted)
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa001', 'a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa002', 'accepted', '2025-09-10 14:00:00+00'),
    -- GridIronKing <-> PickEmPro  (accepted)
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa001', 'a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa003', 'accepted', '2025-09-12 10:30:00+00'),
    -- CFBNerd2025 <-> DynastyDave  (accepted)
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa002', 'a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa004', 'accepted', '2025-09-15 09:00:00+00'),
    -- PickEmPro <-> DynastyDave  (accepted)
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa003', 'a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa004', 'accepted', '2025-09-20 16:00:00+00'),
    -- DynastyDave -> GridIronKing  (pending)
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa004', 'a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa001', 'pending',  '2026-03-08 11:00:00+00');

-- ============================================================
-- 6. Sample Notifications
-- ============================================================

INSERT INTO notifications (user_id, type, title, body, data, read, created_at) VALUES
    -- GridIronKing
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa001', 'friend_request',      'New Friend Request',         'DynastyDave wants to be your friend!',                                  '{"fromUserId": "a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa004"}',  false, '2026-03-08 11:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa001', 'achievement_unlocked', 'Achievement Unlocked!',      'You earned "Unstoppable" -- 30-day login streak!',                      '{"achievementId": "b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb023"}', true,  '2025-10-01 08:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa001', 'prediction_result',   'Prediction Results In',      'You went 9/12 this week -- top 10% of all players!',                    '{"week": "12"}',                                           false, '2026-03-09 22:00:00+00'),

    -- CFBNerd2025
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa002', 'achievement_unlocked', 'Achievement Unlocked!',      'You earned "Grid Master" -- completed 100 grid puzzles!',               '{"achievementId": "b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb003"}', false, '2026-02-10 09:15:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa002', 'game_invite',          'Challenge Received',         'GridIronKing challenged you to Conference Clash!',                      '{"gameType": "conference_clash", "fromUserId": "a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa001"}', false, '2026-03-07 20:00:00+00'),

    -- PickEmPro
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa003', 'prediction_result',   'Prediction Results In',      'You went 10/12 this week -- top 5% of all players!',                    '{"week": "12"}',                                           false, '2026-03-09 22:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa003', 'friend_accepted',     'Friend Request Accepted',    'DynastyDave accepted your friend request.',                             '{"userId": "a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa004"}',       true,  '2025-09-20 16:00:00+00'),

    -- DynastyDave
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa004', 'achievement_unlocked', 'Achievement Unlocked!',      'You earned "Dynasty King" -- back-to-back championships!',              '{"achievementId": "b2b2b2b2-2222-4bbb-bbbb-bbbbbbbbb018"}', false, '2026-01-25 22:00:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa004', 'trade_proposal',      'Trade Offer Received',       'CFBNerd2025 wants to trade you CJ Stroud for your Caleb Williams.',     '{"tradeId": "tr-demo-001"}',                               false, '2026-03-05 14:30:00+00'),
    ('a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa004', 'league_invite',       'League Invitation',          'PickEmPro invited you to join "SEC Dynasty Masters" fantasy league.',   '{"leagueId": "lg-demo-001", "fromUserId": "a1a1a1a1-1111-4aaa-aaaa-aaaaaaaaa003"}', false, '2026-03-06 12:00:00+00');
