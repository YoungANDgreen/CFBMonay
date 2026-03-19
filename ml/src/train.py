"""
GridIron IQ — ML Model Training Pipeline

Usage:
  python -m src.train --seasons 2015-2024 --test-season 2024
  python -m src.train --retrain --latest-week 5
  python -m src.train --backtest --seasons 2015-2024
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone

import numpy as np
import pandas as pd

from .data_loader import CFBDataLoader
from .feature_engineering import FeatureEngineer
from .models import (
    EnsemblePredictor,
    SpreadPredictor,
    TotalPredictor,
    UpsetDetector,
)
from .evaluate import ModelEvaluator


def parse_season_range(s: str) -> list[int]:
    """Parse '2015-2024' into [2015, 2016, ..., 2024]."""
    if "-" in s:
        parts = s.split("-")
        start, end = int(parts[0]), int(parts[1])
        return list(range(start, end + 1))
    return [int(x.strip()) for x in s.split(",")]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="GridIron IQ — Train college football prediction models"
    )
    parser.add_argument(
        "--seasons",
        type=str,
        default="2015-2024",
        help="Season range for training data, e.g. '2015-2024'",
    )
    parser.add_argument(
        "--test-season",
        type=int,
        default=2024,
        help="Season to hold out for testing",
    )
    parser.add_argument(
        "--retrain",
        action="store_true",
        help="Retrain existing models with latest data",
    )
    parser.add_argument(
        "--latest-week",
        type=int,
        default=None,
        help="Latest week of current season to include (for retraining)",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="models",
        help="Directory to save trained models",
    )
    parser.add_argument(
        "--backtest",
        action="store_true",
        help="Run walk-forward backtest across all seasons",
    )
    parser.add_argument(
        "--api-key",
        type=str,
        default=None,
        help="CFBD API key (optional, uses synthetic data if not provided)",
    )

    args = parser.parse_args()
    seasons = parse_season_range(args.seasons)

    print("=" * 60)
    print("  GridIron IQ — ML Training Pipeline")
    print("=" * 60)
    print(f"  Seasons:      {seasons[0]}-{seasons[-1]}")
    print(f"  Test season:  {args.test_season}")
    print(f"  Output dir:   {args.output_dir}")
    print(f"  Backtest:     {args.backtest}")
    print("=" * 60)

    # Initialize components
    data_loader = CFBDataLoader(api_key=args.api_key)
    feature_eng = FeatureEngineer()

    # ----------------------------------------------------------------
    # Backtest mode
    # ----------------------------------------------------------------
    if args.backtest:
        print("\nRunning walk-forward backtest...")
        # We need a dummy ensemble for the evaluator; backtest builds its own
        dummy_ensemble = EnsemblePredictor()
        evaluator = ModelEvaluator(dummy_ensemble)
        results = evaluator.backtest(data_loader, feature_eng, seasons)

        report = evaluator.generate_report(results)
        print(report)

        # Save backtest results
        os.makedirs(args.output_dir, exist_ok=True)
        report_path = os.path.join(args.output_dir, "backtest_results.json")
        with open(report_path, "w") as f:
            f.write(ModelEvaluator.results_to_json(results))
        print(f"\nBacktest results saved to {report_path}")
        return

    # ----------------------------------------------------------------
    # Standard training
    # ----------------------------------------------------------------
    print("\n[1/5] Loading historical data...")
    games_df = data_loader.load_historical_games(seasons)
    print(f"       Loaded {len(games_df)} games across {len(seasons)} seasons")

    print("\n[2/5] Building team stats & features...")
    all_stats: list[pd.DataFrame] = []
    for season in seasons:
        stats = data_loader.load_team_stats(season)
        all_stats.append(stats)
        print(f"       {season}: {len(stats)} teams")
    team_stats_df = pd.concat(all_stats, ignore_index=True)

    print("\n[3/5] Preparing feature matrices...")
    X, y_spread, y_total = data_loader.prepare_training_data(games_df, team_stats_df)
    print(f"       Feature matrix: {X.shape}")
    print(f"       Spread target range: [{y_spread.min():.0f}, {y_spread.max():.0f}]")
    print(f"       Total target range:  [{y_total.min():.0f}, {y_total.max():.0f}]")

    # Split train/test
    X_train, X_test, y_spread_train, y_spread_test = (
        data_loader.train_test_split_by_season(
            X, y_spread, games_df, [args.test_season]
        )
    )
    _, _, y_total_train, y_total_test = (
        data_loader.train_test_split_by_season(
            X, y_total, games_df, [args.test_season]
        )
    )

    print(f"       Train set: {len(X_train)} games")
    print(f"       Test set:  {len(X_test)} games")

    # Build upset labels (underdog wins)
    elo_diff_train = X_train[:, 0]  # elo_diff is the first feature
    y_upset_train = (
        ((elo_diff_train > 0) & (y_spread_train < 0))
        | ((elo_diff_train < 0) & (y_spread_train > 0))
    ).astype(int)
    print(f"       Upset rate in train: {y_upset_train.mean():.1%}")

    # Validation split (last 20% of training data chronologically)
    split_idx = int(len(X_train) * 0.8)
    X_tr, X_val = X_train[:split_idx], X_train[split_idx:]
    y_sp_tr, y_sp_val = y_spread_train[:split_idx], y_spread_train[split_idx:]
    y_to_tr, y_to_val = y_total_train[:split_idx], y_total_train[split_idx:]
    y_up_tr, y_up_val = y_upset_train[:split_idx], y_upset_train[split_idx:]

    feature_names = feature_eng.get_feature_names()

    # ---- Train Spread Model ----
    print("\n[4/5] Training models...")
    print("       Training spread predictor...")
    spread_model = SpreadPredictor(feature_names=feature_names)
    spread_model.train(X_tr, y_sp_tr, X_val, y_sp_val)

    # ---- Train Total Model ----
    print("       Training total predictor...")
    total_model = TotalPredictor(feature_names=feature_names)
    total_model.train(X_tr, y_to_tr, X_val, y_to_val)

    # ---- Train Upset Detector ----
    print("       Training upset detector...")
    upset_model = UpsetDetector(feature_names=feature_names)
    upset_model.train(X_tr, y_up_tr, X_val, y_up_val)

    # Build ensemble
    ensemble = EnsemblePredictor(
        spread_model=spread_model,
        total_model=total_model,
        upset_model=upset_model,
        feature_names=feature_names,
    )
    ensemble.training_date = datetime.now(timezone.utc).isoformat()

    # ---- Evaluate ----
    print("\n[5/5] Evaluating on test season ({})...".format(args.test_season))
    evaluator = ModelEvaluator(ensemble)
    metrics = evaluator.evaluate_season(X_test, y_spread_test, y_total_test)
    metrics["season"] = args.test_season

    ensemble.accuracy_metrics = metrics

    report = evaluator.generate_report([metrics])
    print(report)

    # Feature importance summary
    print("\n  Top Feature Importances (Spread Model):")
    spread_imp = spread_model.get_feature_importance()
    sorted_imp = sorted(spread_imp.items(), key=lambda x: x[1], reverse=True)
    for name, imp in sorted_imp[:10]:
        bar = "#" * int(imp * 200)
        print(f"    {name:30s} {imp:.4f}  {bar}")

    # ---- Save models ----
    print(f"\nSaving models to {args.output_dir}/...")
    ensemble.save(args.output_dir)

    # Save evaluation report
    report_path = os.path.join(args.output_dir, "evaluation_report.json")
    with open(report_path, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"Models and evaluation report saved.")
    print("\nDone.")


if __name__ == "__main__":
    main()
