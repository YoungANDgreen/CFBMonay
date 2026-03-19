"""
GridIron IQ — Model Evaluation & Backtesting

Provides accuracy metrics, walk-forward backtesting, and comparison
against Vegas lines.
"""

import json
from typing import Optional

import numpy as np
import pandas as pd

from .models import EnsemblePredictor, SpreadPredictor, TotalPredictor, UpsetDetector
from .data_loader import CFBDataLoader
from .feature_engineering import FeatureEngineer


class ModelEvaluator:
    """Evaluates prediction models on held-out data."""

    def __init__(self, models: EnsemblePredictor) -> None:
        self.models = models

    def evaluate_season(
        self,
        X_test: np.ndarray,
        y_spread: np.ndarray,
        y_total: np.ndarray,
        y_upset: Optional[np.ndarray] = None,
    ) -> dict:
        """Compute accuracy metrics on a test set.

        Parameters
        ----------
        X_test : feature matrix
        y_spread : actual spreads
        y_total : actual totals
        y_upset : binary upset labels (optional, derived from spread if None)

        Returns
        -------
        dict with MAE, RMSE, accuracy, upset detection metrics.
        """
        pred_spreads = self.models.spread_model.predict(X_test)
        pred_totals = self.models.total_model.predict(X_test)

        # Spread metrics
        spread_errors = pred_spreads - y_spread
        spread_mae = float(np.mean(np.abs(spread_errors)))
        spread_rmse = float(np.sqrt(np.mean(spread_errors**2)))
        spread_median_ae = float(np.median(np.abs(spread_errors)))

        # Total metrics
        total_errors = pred_totals - y_total
        total_mae = float(np.mean(np.abs(total_errors)))
        total_rmse = float(np.sqrt(np.mean(total_errors**2)))

        # Straight-up accuracy: did we get the winner right?
        pred_home_wins = pred_spreads > 0
        actual_home_wins = y_spread > 0
        straight_up_accuracy = float(np.mean(pred_home_wins == actual_home_wins))

        # ATS (against the spread) accuracy: use a simple baseline of 0
        # i.e., did we predict the correct direction of the spread?
        ats_correct = np.sign(pred_spreads) == np.sign(y_spread)
        # Exclude pushes (spread == 0)
        non_push = y_spread != 0
        ats_accuracy = float(np.mean(ats_correct[non_push])) if non_push.sum() > 0 else 0.0

        # Upset detection
        if y_upset is None:
            # Define upset as home team (higher Elo by convention in features)
            # losing, i.e., spread < 0 when model expects home to be favored
            # For simplicity: upset = underdog wins. We use the Elo diff sign in X.
            # The first feature (elo_diff) > 0 means home favored.
            elo_diff = X_test[:, 0] if X_test.shape[1] > 0 else np.zeros(len(y_spread))
            y_upset = ((elo_diff > 0) & (y_spread < 0)) | ((elo_diff < 0) & (y_spread > 0))
            y_upset = y_upset.astype(int)

        upset_probs = self.models.upset_model.predict_proba(X_test)
        upset_preds = (upset_probs >= UpsetDetector.UPSET_THRESHOLD).astype(int)

        n_actual_upsets = int(y_upset.sum())
        n_predicted_upsets = int(upset_preds.sum())

        if n_actual_upsets > 0:
            upset_recall = float(np.sum((upset_preds == 1) & (y_upset == 1)) / n_actual_upsets)
        else:
            upset_recall = 0.0

        if n_predicted_upsets > 0:
            upset_precision = float(
                np.sum((upset_preds == 1) & (y_upset == 1)) / n_predicted_upsets
            )
        else:
            upset_precision = 0.0

        return {
            "n_games": len(y_spread),
            "spread_mae": round(spread_mae, 2),
            "spread_rmse": round(spread_rmse, 2),
            "spread_median_ae": round(spread_median_ae, 2),
            "total_mae": round(total_mae, 2),
            "total_rmse": round(total_rmse, 2),
            "straight_up_accuracy": round(straight_up_accuracy, 4),
            "ats_accuracy": round(ats_accuracy, 4),
            "n_actual_upsets": n_actual_upsets,
            "n_predicted_upsets": n_predicted_upsets,
            "upset_recall": round(upset_recall, 4),
            "upset_precision": round(upset_precision, 4),
        }

    def backtest(
        self,
        data_loader: CFBDataLoader,
        feature_eng: FeatureEngineer,
        seasons: list[int],
    ) -> list[dict]:
        """Walk-forward backtest across multiple seasons.

        For each test season, trains on all prior seasons, then evaluates
        on the test season. Prevents any future data leakage.

        Parameters
        ----------
        data_loader : data source
        feature_eng : feature engineer
        seasons : list of seasons in chronological order

        Returns
        -------
        List of per-season evaluation dicts.
        """
        results: list[dict] = []

        for i, test_season in enumerate(seasons):
            if i < 2:
                # Need at least 2 seasons of training data
                continue

            train_seasons = seasons[:i]
            print(f"\n--- Backtesting: train on {train_seasons[0]}-{train_seasons[-1]}, "
                  f"test on {test_season} ---")

            # Load all data up through test season
            all_seasons = train_seasons + [test_season]
            games_df = data_loader.load_historical_games(all_seasons)

            # Build team stats for each season
            all_stats: list[pd.DataFrame] = []
            for s in all_seasons:
                all_stats.append(data_loader.load_team_stats(s))
            team_stats_df = pd.concat(all_stats, ignore_index=True)

            # Prepare features
            X, y_spread, y_total = data_loader.prepare_training_data(
                games_df, team_stats_df
            )

            # Split by season
            X_train, X_test, y_spread_train, y_spread_test = (
                data_loader.train_test_split_by_season(
                    X, y_spread, games_df, [test_season]
                )
            )
            _, _, y_total_train, y_total_test = (
                data_loader.train_test_split_by_season(
                    X, y_total, games_df, [test_season]
                )
            )

            if len(X_train) == 0 or len(X_test) == 0:
                print(f"  Skipping {test_season}: insufficient data")
                continue

            # Build upset labels for training
            elo_diff_train = X_train[:, 0]
            y_upset_train = (
                ((elo_diff_train > 0) & (y_spread_train < 0))
                | ((elo_diff_train < 0) & (y_spread_train > 0))
            ).astype(int)

            # Use last 20% of training as validation
            split_idx = int(len(X_train) * 0.8)
            X_tr, X_val = X_train[:split_idx], X_train[split_idx:]
            y_sp_tr, y_sp_val = y_spread_train[:split_idx], y_spread_train[split_idx:]
            y_to_tr, y_to_val = y_total_train[:split_idx], y_total_train[split_idx:]
            y_up_tr, y_up_val = y_upset_train[:split_idx], y_upset_train[split_idx:]

            # Train models
            feature_names = feature_eng.get_feature_names()

            spread_model = SpreadPredictor(feature_names=feature_names)
            spread_model.train(X_tr, y_sp_tr, X_val, y_sp_val)

            total_model = TotalPredictor(feature_names=feature_names)
            total_model.train(X_tr, y_to_tr, X_val, y_to_val)

            upset_model = UpsetDetector(feature_names=feature_names)
            upset_model.train(X_tr, y_up_tr, X_val, y_up_val)

            ensemble = EnsemblePredictor(
                spread_model=spread_model,
                total_model=total_model,
                upset_model=upset_model,
                feature_names=feature_names,
            )

            # Evaluate
            evaluator = ModelEvaluator(ensemble)
            metrics = evaluator.evaluate_season(X_test, y_spread_test, y_total_test)
            metrics["season"] = test_season
            metrics["train_seasons"] = f"{train_seasons[0]}-{train_seasons[-1]}"
            results.append(metrics)

            print(f"  Spread MAE: {metrics['spread_mae']:.2f}")
            print(f"  Total MAE: {metrics['total_mae']:.2f}")
            print(f"  SU Accuracy: {metrics['straight_up_accuracy']:.1%}")
            print(f"  Upset Recall: {metrics['upset_recall']:.1%}")

        return results

    def compare_to_vegas(
        self,
        predictions: np.ndarray,
        vegas_lines: np.ndarray,
        actuals: np.ndarray,
    ) -> dict:
        """Compare model MAE to Vegas lines MAE.

        Parameters
        ----------
        predictions : model predicted spreads
        vegas_lines : Vegas consensus spreads
        actuals : actual game spreads

        Returns
        -------
        dict with model_mae, vegas_mae, improvement, and head-to-head record.
        """
        model_errors = np.abs(predictions - actuals)
        vegas_errors = np.abs(vegas_lines - actuals)

        model_mae = float(np.mean(model_errors))
        vegas_mae = float(np.mean(vegas_errors))
        improvement = vegas_mae - model_mae

        # Head to head: how often is the model closer?
        model_wins = int(np.sum(model_errors < vegas_errors))
        vegas_wins = int(np.sum(vegas_errors < model_errors))
        ties = int(np.sum(model_errors == vegas_errors))

        return {
            "model_mae": round(model_mae, 2),
            "vegas_mae": round(vegas_mae, 2),
            "improvement": round(improvement, 2),
            "model_wins": model_wins,
            "vegas_wins": vegas_wins,
            "ties": ties,
            "model_win_pct": round(model_wins / max(model_wins + vegas_wins, 1), 4),
        }

    def generate_report(self, results: list[dict]) -> str:
        """Generate a formatted evaluation report.

        Parameters
        ----------
        results : list of per-season evaluation dicts from backtest()
                  or a single-element list from evaluate_season().

        Returns
        -------
        Formatted string report.
        """
        lines: list[str] = []
        lines.append("=" * 60)
        lines.append("  GridIron IQ — Model Evaluation Report")
        lines.append("=" * 60)

        for r in results:
            season_label = r.get("season", "N/A")
            train_label = r.get("train_seasons", "N/A")
            lines.append(f"\n  Season: {season_label}  (trained on {train_label})")
            lines.append("-" * 50)
            lines.append(f"  Games evaluated:       {r['n_games']}")
            lines.append(f"  Spread MAE:            {r['spread_mae']:.2f} pts")
            lines.append(f"  Spread RMSE:           {r['spread_rmse']:.2f} pts")
            lines.append(f"  Spread Median AE:      {r['spread_median_ae']:.2f} pts")
            lines.append(f"  Total MAE:             {r['total_mae']:.2f} pts")
            lines.append(f"  Total RMSE:            {r['total_rmse']:.2f} pts")
            lines.append(f"  Straight-Up Accuracy:  {r['straight_up_accuracy']:.1%}")
            lines.append(f"  ATS Accuracy:          {r['ats_accuracy']:.1%}")
            lines.append(f"  Actual Upsets:         {r['n_actual_upsets']}")
            lines.append(f"  Predicted Upsets:      {r['n_predicted_upsets']}")
            lines.append(f"  Upset Recall:          {r['upset_recall']:.1%}")
            lines.append(f"  Upset Precision:       {r['upset_precision']:.1%}")

        # Summary across all seasons
        if len(results) > 1:
            avg_spread_mae = np.mean([r["spread_mae"] for r in results])
            avg_total_mae = np.mean([r["total_mae"] for r in results])
            avg_su = np.mean([r["straight_up_accuracy"] for r in results])
            avg_upset_recall = np.mean([r["upset_recall"] for r in results])

            lines.append("\n" + "=" * 50)
            lines.append("  AVERAGE ACROSS ALL SEASONS")
            lines.append("=" * 50)
            lines.append(f"  Spread MAE:            {avg_spread_mae:.2f} pts")
            lines.append(f"  Total MAE:             {avg_total_mae:.2f} pts")
            lines.append(f"  Straight-Up Accuracy:  {avg_su:.1%}")
            lines.append(f"  Upset Recall:          {avg_upset_recall:.1%}")

        lines.append("\n" + "=" * 60)
        return "\n".join(lines)

    @staticmethod
    def results_to_json(results: list[dict]) -> str:
        """Serialize evaluation results to JSON."""
        return json.dumps(results, indent=2)
