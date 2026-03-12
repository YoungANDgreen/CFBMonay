# GridIron IQ — Game Improvements Design Spec

## 1. Film Room: Team Name Disguising & Content Expansion

### Disguising
- **Default (Mode B):** Replace team names with contextual hints — "a top-10 SEC team," "an unranked Big 12 underdog," "the home team," "the visiting squad"
- **Hard rounds (Mode A):** Full anonymization — "Team A" and "Team B" with no conference/ranking hints
- Mix: ~70% Mode B, ~30% Mode A per game session (seeded RNG)
- Template functions generate descriptions using hint placeholders instead of real names
- Post-reveal: Show actual team names, logos side-by-side, and broadcast quote (if available)

### Content: Legends Curated Classics (pre-2014)
- Hand-curated JSON file: `src/data/film-room-legends.json`
- ~40-50 all-time classic games sourced from ESPN 150 Greatest Games list
- Each entry: `{ id, season, homeTeam, awayTeam, homeScore, awayScore, description, broadcastQuote?, announcer?, venue, gameType }`
- Description written in disguised format (no team names, uses hints)
- Game types: upset, rivalry, championship, heisman-moment, trick-play, comeback
- Broadcast quotes curated for ~30 of the most iconic (Kick Six, Flutie Hail Mary, Vince Young Rose Bowl, etc.)

### Content: Dynamic from 2014-2024 Data
- Filter games by: ranked matchups (both teams ranked), upsets (Elo delta > 150), close games (margin <= 7), conference championships, high-excitement games
- Generate disguised descriptions dynamically using template system
- Each daily game: 3-4 rounds from real data + 1-2 Legends rounds

### Post-Reveal Experience
- Team logos displayed side-by-side (Home vs Away)
- Final score revealed with animation
- Broadcast quote (if available) displayed in stylized quote block
- "Learn More" link to game recap (optional)

## 2. Grid: Expanded Stat Thresholds & Compatibility Matrix

### 50 Stat Threshold Criteria
Organized by category with position compatibility:

**Passing (QB only):**
- 1+ Passing TD, 10+ Passing TDs, 20+ Passing TDs, 30+ Passing TDs, 40+ Passing TDs
- 1000+ Passing Yards, 2000+ Passing Yards, 3000+ Passing Yards, 4000+ Passing Yards
- 10+ Interceptions Thrown

**Rushing (QB, RB, ATH):**
- 500+ Rushing Yards, 1000+ Rushing Yards, 1500+ Rushing Yards, 2000+ Rushing Yards
- 5+ Rushing TDs, 10+ Rushing TDs, 15+ Rushing TDs, 20+ Rushing TDs

**Receiving (WR, RB, ATH):**
- 500+ Receiving Yards, 1000+ Receiving Yards, 1500+ Receiving Yards
- 5+ Receiving TDs, 10+ Receiving TDs, 15+ Receiving TDs

**Total TDs (QB, RB, WR, ATH):**
- 10+ Total TDs, 15+ Total TDs, 20+ Total TDs, 25+ Total TDs, 30+ Total TDs

**Defensive (DEF):**
- 3+ Sacks, 5+ Sacks, 8+ Sacks, 10+ Sacks
- 3+ Interceptions (Def), 5+ Interceptions (Def), 8+ Interceptions (Def)
- 2+ Forced Fumbles, 3+ Forced Fumbles
- 5+ Passes Defended, 10+ Passes Defended

**Cross-position (trick plays / rare):**
- 1+ Passing TD (WR, RB, ATH) — trick play specials
- 1+ Receiving TD (QB) — rare trick play catches
- 100+ Rushing Yards (WR) — jet sweep specialists

### Compatibility Matrix
Each stat criterion stores `compatiblePositions: string[]`. During puzzle generation, when a stat criterion is on one axis and a position on the other, the engine checks compatibility before placing the cell. Incompatible combos are skipped (engine picks a different criterion).

### Year Display
- Player search results show all active seasons in parentheses: "Derrick Henry - RB - Alabama (2013-2015)"
- After selecting a player, year dropdown appears showing only their active seasons
- Selected year determines which season stats are checked against the threshold

## 3. Stat Stack: Year Selection & Mixed Constraints

### Year Selection Mode (Mixed)
- Each puzzle has 5 rows. Some rows lock a year, others are open:
  - **Locked row example:** "Pick a RB from 2019 season" — only 2019 stats count
  - **Open row example:** "Pick a player from the SEC" — any year, user selects via dropdown
- ~2-3 locked rows + ~2-3 open rows per puzzle (seeded RNG)
- When year is open, user picks player then selects season from dropdown (only active years shown)
- Stat value pulled from the specific season selected

### Constraint Pool Expansion
- Add year-locked constraints: "2015 season," "2008 season," "Pre-2010 season," "2020+ season"
- Add ranking constraints using rankings.json: "Player from a top-10 ranked team," "Player from an unranked team"
- Keep existing constraints: conference, position, school group

## 4. UI: School Logos & Team Branding

### Logo Source
- ESPN CDN: `https://a.espncdn.com/i/teamlogos/ncaa/500/{espnTeamId}.png`
- Build mapping file `src/data/team-logos.json`: `{ school: string, espnId: number, logoUrl: string, darkLogoUrl?: string }`
- Populate for all 136 FBS teams
- Cache logos locally using React Native Image caching (expo-image)

### Player Headshots
- ESPN CDN: `https://a.espncdn.com/i/headshots/college-football/players/full/{espnPlayerId}.png`
- Build mapping for notable players (top ~500 by stat lines) in `src/data/player-headshots.json`
- Fallback: position-specific silhouette icon (QB, RB, WR, DEF, K)
- Show in player search results and game answer reveals

### Integration Points
- **Player Search:** Logo next to school name, headshot thumbnail left of player name
- **Grid:** Team logos in criteria headers (conference logo, school logo)
- **Stat Stack:** Team logo next to each pick row
- **Film Room:** Team logos in post-reveal side-by-side display
- **All Games:** Conference logos on leaderboards and game cards

## 5. UI: Animations & Micro-interactions

- **Grid cell guess:** Flip animation (card flip 3D) revealing correct (green glow) or incorrect (red flash)
- **Score counter:** Rolling number animation on score changes
- **Rarity reveal:** Legendary answers get gold particle burst, Epic gets purple shimmer
- **Game completion:** Confetti animation on perfect grid / high percentile Stat Stack
- **Streak indicator:** Fire emoji with scale pulse animation on consecutive correct answers
- Use `react-native-reanimated` for smooth 60fps animations

## 6. UI: Card & Layout Upgrades

### Home Screen Game Cards
- Gradient backgrounds using game-specific accent colors
- Team logo watermarks as subtle background elements
- Daily streak indicator badge on each card
- Difficulty/completion indicators

### Rarity Visual System
- Common: Default border
- Uncommon: Blue border glow
- Rare: Purple border glow + subtle shimmer
- Epic: Orange border glow + particle effect
- Legendary: Gold border glow + pulsing aura + particle burst

### Game-Specific Chrome
- **Film Room:** Film strip border elements, projector-style reveal animation
- **Grid:** Stadium scoreboard aesthetic, LED-dot font for scores
- **Stat Stack:** Sports ticker styling, stat bars with team colors
- **Dynasty:** Trophy case / recruiting board aesthetic

### Typography & Spacing
- Tighter section headers with gold accent underlines
- Consistent card padding and border radius
- Better visual hierarchy between primary/secondary content
