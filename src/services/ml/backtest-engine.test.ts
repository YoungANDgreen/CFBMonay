import {
  getBacktestResults,
  getOverallModelAccuracy,
  getCurrentSeasonAccuracy,
  getAccuracyTrend,
  compareToVegasLine,
  getBacktestBySeason,
} from './backtest-engine';

describe('backtest-engine', () => {
  describe('getBacktestResults', () => {
    it('returns 10 seasons (2015-2024)', () => {
      const results = getBacktestResults();
      expect(results).toHaveLength(10);
    });

    it('covers seasons 2015 through 2024', () => {
      const results = getBacktestResults();
      const seasons = results.map((r) => r.season);
      expect(seasons[0]).toBe(2015);
      expect(seasons[seasons.length - 1]).toBe(2024);

      for (let year = 2015; year <= 2024; year++) {
        expect(seasons).toContain(year);
      }
    });

    it('each season has valid accuracy (0-1 range)', () => {
      const results = getBacktestResults();

      for (const result of results) {
        expect(result.accuracy).toBeGreaterThanOrEqual(0);
        expect(result.accuracy).toBeLessThanOrEqual(1);
        expect(result.totalGames).toBeGreaterThan(0);
        expect(result.correctPicks).toBeLessThanOrEqual(result.totalGames);
        expect(result.correctPicks).toBeGreaterThan(0);
      }
    });

    it('returns a new array (does not expose internal state)', () => {
      const results1 = getBacktestResults();
      const results2 = getBacktestResults();
      expect(results1).not.toBe(results2);
      expect(results1).toEqual(results2);
    });
  });

  describe('getOverallModelAccuracy', () => {
    it('returns valid ModelAccuracy', () => {
      const accuracy = getOverallModelAccuracy();

      expect(accuracy.atsRecord).toBeDefined();
      expect(accuracy.atsRecord.wins).toBeGreaterThan(0);
      expect(accuracy.atsRecord.losses).toBeGreaterThan(0);

      expect(accuracy.spreadMAE).toBeGreaterThan(0);
      expect(accuracy.totalMAE).toBeGreaterThan(0);

      expect(accuracy.upsetDetectionRate).toBeGreaterThanOrEqual(0);
      expect(accuracy.upsetDetectionRate).toBeLessThanOrEqual(1);

      expect(accuracy.seasonAccuracy).toBeGreaterThanOrEqual(0);
      expect(accuracy.seasonAccuracy).toBeLessThanOrEqual(1);
    });

    it('overall accuracy is reasonable (above 0.5)', () => {
      const accuracy = getOverallModelAccuracy();
      expect(accuracy.seasonAccuracy).toBeGreaterThan(0.5);
    });
  });

  describe('getCurrentSeasonAccuracy', () => {
    it('returns 2024 data', () => {
      const current = getCurrentSeasonAccuracy();
      const season2024 = getBacktestBySeason(2024);

      expect(season2024).toBeDefined();
      expect(current.seasonAccuracy).toBe(season2024!.accuracy);
      expect(current.spreadMAE).toBe(season2024!.spreadMAE);
    });

    it('returns valid ModelAccuracy shape', () => {
      const current = getCurrentSeasonAccuracy();

      expect(current.atsRecord).toBeDefined();
      expect(current.atsRecord.wins).toBeGreaterThan(0);
      expect(current.spreadMAE).toBeGreaterThan(0);
      expect(current.totalMAE).toBeGreaterThan(0);
      expect(current.seasonAccuracy).toBeGreaterThan(0);
      expect(current.seasonAccuracy).toBeLessThanOrEqual(1);
    });
  });

  describe('getAccuracyTrend', () => {
    it('returns arrays of equal length', () => {
      const trend = getAccuracyTrend();

      expect(trend.seasons.length).toBe(trend.accuracies.length);
      expect(trend.seasons.length).toBe(trend.maes.length);
      expect(trend.seasons.length).toBe(10);
    });

    it('seasons are in chronological order', () => {
      const trend = getAccuracyTrend();

      for (let i = 1; i < trend.seasons.length; i++) {
        expect(trend.seasons[i]).toBeGreaterThan(trend.seasons[i - 1]);
      }
    });

    it('accuracies are in valid range', () => {
      const trend = getAccuracyTrend();

      for (const acc of trend.accuracies) {
        expect(acc).toBeGreaterThanOrEqual(0);
        expect(acc).toBeLessThanOrEqual(1);
      }
    });

    it('MAEs are positive', () => {
      const trend = getAccuracyTrend();

      for (const mae of trend.maes) {
        expect(mae).toBeGreaterThan(0);
      }
    });
  });

  describe('compareToVegasLine', () => {
    it('returns comparison data with valid structure', () => {
      const comparison = compareToVegasLine();

      expect(comparison.modelMAE).toBeGreaterThan(0);
      expect(comparison.vegasMAE).toBeGreaterThan(0);
      expect(typeof comparison.modelEdge).toBe('number');
      expect(comparison.seasons).toBeDefined();
      expect(comparison.seasons.length).toBe(10);
    });

    it('each season comparison has both model and vegas MAE', () => {
      const comparison = compareToVegasLine();

      for (const season of comparison.seasons) {
        expect(season.year).toBeGreaterThanOrEqual(2015);
        expect(season.year).toBeLessThanOrEqual(2024);
        expect(season.modelMAE).toBeGreaterThan(0);
        expect(season.vegasMAE).toBeGreaterThan(0);
      }
    });

    it('modelEdge is consistent with MAE values', () => {
      const comparison = compareToVegasLine();
      // modelEdge = vegasMAE - modelMAE
      expect(comparison.modelEdge).toBeCloseTo(
        comparison.vegasMAE - comparison.modelMAE,
        2,
      );
    });
  });
});
