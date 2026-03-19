import {
  MOCK_TEAM_FEATURES,
  RIVALRY_PAIRS,
  buildMatchupFeatures,
  predictSpread,
  predictTotal,
  predictUpset,
  generateGamePrediction,
} from './prediction-engine';

describe('prediction-engine', () => {
  describe('MOCK_TEAM_FEATURES', () => {
    it('has 25+ teams', () => {
      const teamCount = Object.keys(MOCK_TEAM_FEATURES).length;
      expect(teamCount).toBeGreaterThanOrEqual(25);
    });
  });

  describe('buildMatchupFeatures', () => {
    it('returns valid features for known teams', () => {
      const features = buildMatchupFeatures('alabama', 'georgia', 'game-1');

      expect(features.gameId).toBe('game-1');
      expect(features.homeTeam.teamId).toBe('alabama');
      expect(features.awayTeam.teamId).toBe('georgia');
      expect(typeof features.eloDiff).toBe('number');
      expect(typeof features.recruitingDiff).toBe('number');
      expect(typeof features.isConferenceGame).toBe('boolean');
      expect(typeof features.isRivalryGame).toBe('boolean');
      expect(typeof features.homeFieldAdvantage).toBe('number');
    });

    it('throws for unknown team', () => {
      expect(() =>
        buildMatchupFeatures('fake_team', 'alabama', 'game-1'),
      ).toThrow('Unknown home team');
    });

    it('detects conference game correctly', () => {
      // Alabama and Georgia are both SEC
      const features = buildMatchupFeatures('alabama', 'georgia', 'game-1');
      expect(features.isConferenceGame).toBe(true);

      // Alabama (SEC) vs Clemson (ACC) is not a conference game
      const crossConf = buildMatchupFeatures('alabama', 'clemson', 'game-2');
      expect(crossConf.isConferenceGame).toBe(false);
    });
  });

  describe('predictSpread', () => {
    it('returns value in reasonable range (-35 to 35)', () => {
      const matchup = buildMatchupFeatures('ohio_state', 'michigan', 'game-1');
      const spread = predictSpread(matchup);

      expect(spread.value).toBeGreaterThanOrEqual(0);
      expect(spread.value).toBeLessThanOrEqual(35);
    });

    it('confidence is between 0.5 and 0.95', () => {
      const matchup = buildMatchupFeatures('georgia', 'florida_state', 'game-1');
      const spread = predictSpread(matchup);

      expect(spread.confidence).toBeGreaterThanOrEqual(0.5);
      expect(spread.confidence).toBeLessThanOrEqual(0.95);
    });

    it('returns a favored team name', () => {
      const matchup = buildMatchupFeatures('alabama', 'georgia', 'game-1');
      const spread = predictSpread(matchup);

      expect(typeof spread.favored).toBe('string');
      expect(spread.favored.length).toBeGreaterThan(0);
    });

    it('home team advantage affects matchup features', () => {
      const matchupDefault = buildMatchupFeatures('ohio_state', 'michigan', 'game-1');
      const matchupNoHome = buildMatchupFeatures('ohio_state', 'michigan', 'game-2', {
        homeFieldAdvantage: 0,
      });

      // Home field advantage should differ between the two matchups
      expect(matchupDefault.homeFieldAdvantage).toBe(3.0);
      expect(matchupNoHome.homeFieldAdvantage).toBe(0);
    });
  });

  describe('predictTotal', () => {
    it('returns value in 28-80 range', () => {
      const matchup = buildMatchupFeatures('texas', 'oklahoma', 'game-1');
      const total = predictTotal(matchup);

      expect(total.value).toBeGreaterThanOrEqual(28);
      expect(total.value).toBeLessThanOrEqual(80);
    });

    it('returns a confidence value', () => {
      const matchup = buildMatchupFeatures('ohio_state', 'penn_state', 'game-1');
      const total = predictTotal(matchup);

      expect(total.confidence).toBeGreaterThan(0);
      expect(total.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('predictUpset', () => {
    it('returns probability between 0 and 1', () => {
      const matchup = buildMatchupFeatures('georgia', 'florida_state', 'game-1');
      const spread = predictSpread(matchup);
      const upset = predictUpset(matchup, spread.value);

      expect(upset.probability).toBeGreaterThanOrEqual(0);
      expect(upset.probability).toBeLessThanOrEqual(1);
    });

    it('returns isAlert boolean', () => {
      const matchup = buildMatchupFeatures('alabama', 'tennessee', 'game-1');
      const spread = predictSpread(matchup);
      const upset = predictUpset(matchup, spread.value);

      expect(typeof upset.isAlert).toBe('boolean');
    });

    it('higher spread leads to lower upset probability', () => {
      const matchup = buildMatchupFeatures('ohio_state', 'florida_state', 'game-1');
      const lowSpread = predictUpset(matchup, 3);
      const highSpread = predictUpset(matchup, 21);

      expect(lowSpread.probability).toBeGreaterThan(highSpread.probability);
    });
  });

  describe('generateGamePrediction', () => {
    it('returns complete GamePrediction object', () => {
      const prediction = generateGamePrediction('alabama', 'lsu', 'game-1');

      expect(prediction.gameId).toBe('game-1');
      expect(prediction.homeTeam).toBe('Alabama');
      expect(prediction.awayTeam).toBe('LSU');
      expect(prediction.modelVersion).toBeDefined();
      expect(prediction.generatedAt).toBeDefined();

      // Spread predictions
      expect(prediction.predictions.spread).toBeDefined();
      expect(prediction.predictions.spread.value).toBeGreaterThanOrEqual(0);
      expect(prediction.predictions.spread.confidence).toBeGreaterThanOrEqual(0.5);
      expect(typeof prediction.predictions.spread.favored).toBe('string');

      // Total predictions
      expect(prediction.predictions.total).toBeDefined();
      expect(prediction.predictions.total.value).toBeGreaterThanOrEqual(28);

      // Upset predictions
      expect(prediction.predictions.upset).toBeDefined();
      expect(prediction.predictions.upset.probability).toBeGreaterThanOrEqual(0);
      expect(prediction.predictions.upset.probability).toBeLessThanOrEqual(1);

      // Top factors
      expect(prediction.topFactors).toBeDefined();
      expect(prediction.topFactors.length).toBeGreaterThan(0);
      expect(prediction.topFactors.length).toBeLessThanOrEqual(5);
    });
  });

  describe('rivalry detection', () => {
    it('detects known rivalry: Alabama vs Tennessee', () => {
      const features = buildMatchupFeatures('alabama', 'tennessee', 'game-1');
      expect(features.isRivalryGame).toBe(true);
    });

    it('detects known rivalry: Ohio State vs Michigan', () => {
      const features = buildMatchupFeatures('ohio_state', 'michigan', 'game-1');
      expect(features.isRivalryGame).toBe(true);
    });

    it('detects known rivalry: Texas vs Oklahoma', () => {
      const features = buildMatchupFeatures('texas', 'oklahoma', 'game-1');
      expect(features.isRivalryGame).toBe(true);
    });

    it('detects rivalry regardless of home/away order', () => {
      const featuresA = buildMatchupFeatures('alabama', 'lsu', 'game-1');
      const featuresB = buildMatchupFeatures('lsu', 'alabama', 'game-2');

      expect(featuresA.isRivalryGame).toBe(true);
      expect(featuresB.isRivalryGame).toBe(true);
    });

    it('returns false for non-rivalry matchup', () => {
      const features = buildMatchupFeatures('ohio_state', 'boise_state', 'game-1');
      expect(features.isRivalryGame).toBe(false);
    });

    it('rivalry boosts upset probability', () => {
      const rivalryMatchup = buildMatchupFeatures('alabama', 'tennessee', 'game-1');
      const nonRivalryMatchup = buildMatchupFeatures('alabama', 'memphis', 'game-2');

      const rivalrySpread = predictSpread(rivalryMatchup);
      const nonRivalrySpread = predictSpread(nonRivalryMatchup);

      const rivalryUpset = predictUpset(rivalryMatchup, rivalrySpread.value);
      const nonRivalryUpset = predictUpset(nonRivalryMatchup, nonRivalrySpread.value);

      // Rivalry game should have higher upset probability (given similar spreads)
      // Since the spreads may differ, we check both separately
      const rivalryUpsetAtFixedSpread = predictUpset(rivalryMatchup, 7);
      const nonRivalryUpsetAtFixedSpread = predictUpset(nonRivalryMatchup, 7);
      expect(rivalryUpsetAtFixedSpread.probability).toBeGreaterThan(
        nonRivalryUpsetAtFixedSpread.probability,
      );
    });
  });
});
