"""
GridIron IQ — ML Models for College Football Predictions

Contains XGBoost-based models for spread prediction, total prediction,
and upset detection, plus an ensemble that combines all three.
"""

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
from xgboost import XGBRegressor, XGBClassifier


class SpreadPredictor:
    """XGBoost regression model for predicting point spreads."""

    def __init__(self, feature_names: Optional[list[str]] = None) -> None:
        self.feature_names = feature_names or []
        self.model = XGBRegressor(
            n_estimators=500,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.1,
            reg_lambda=1.0,
            min_child_weight=5,
            objective="reg:squarederror",
            random_state=42,
            n_jobs=-1,
        )
        self._is_trained = False

    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray,
    ) -> None:
        """Train the spread model with early stopping on validation set."""
        self.model.fit(
            X_train,
            y_train,
            eval_set=[(X_val, y_val)],
            verbose=False,
        )
        self._is_trained = True

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Return predicted point spreads (home - away perspective)."""
        if not self._is_trained:
            raise RuntimeError("Model has not been trained yet.")
        return self.model.predict(X)

    def get_feature_importance(self) -> dict[str, float]:
        """Return feature name to importance score mapping."""
        if not self._is_trained:
            return {}
        importances = self.model.feature_importances_
        if self.feature_names and len(self.feature_names) == len(importances):
            return {
                name: float(imp)
                for name, imp in zip(self.feature_names, importances)
            }
        return {f"f{i}": float(v) for i, v in enumerate(importances)}

    def save(self, path: str) -> None:
        """Save model to disk via joblib."""
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        joblib.dump(
            {"model": self.model, "feature_names": self.feature_names},
            path,
        )

    def load(self, path: str) -> None:
        """Load a previously saved model."""
        data = joblib.load(path)
        self.model = data["model"]
        self.feature_names = data.get("feature_names", [])
        self._is_trained = True


class TotalPredictor:
    """XGBoost regression model for predicting game totals (over/under)."""

    def __init__(self, feature_names: Optional[list[str]] = None) -> None:
        self.feature_names = feature_names or []
        self.model = XGBRegressor(
            n_estimators=500,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.1,
            reg_lambda=1.0,
            min_child_weight=5,
            objective="reg:squarederror",
            random_state=42,
            n_jobs=-1,
        )
        self._is_trained = False

    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray,
    ) -> None:
        """Train the total model with early stopping on validation set."""
        self.model.fit(
            X_train,
            y_train,
            eval_set=[(X_val, y_val)],
            verbose=False,
        )
        self._is_trained = True

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Return predicted game totals."""
        if not self._is_trained:
            raise RuntimeError("Model has not been trained yet.")
        return self.model.predict(X)

    def get_feature_importance(self) -> dict[str, float]:
        if not self._is_trained:
            return {}
        importances = self.model.feature_importances_
        if self.feature_names and len(self.feature_names) == len(importances):
            return {
                name: float(imp)
                for name, imp in zip(self.feature_names, importances)
            }
        return {f"f{i}": float(v) for i, v in enumerate(importances)}

    def save(self, path: str) -> None:
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        joblib.dump(
            {"model": self.model, "feature_names": self.feature_names},
            path,
        )

    def load(self, path: str) -> None:
        data = joblib.load(path)
        self.model = data["model"]
        self.feature_names = data.get("feature_names", [])
        self._is_trained = True


class UpsetDetector:
    """XGBoost binary classifier for predicting upsets.

    An "upset" is defined as the lower-Elo team winning. The classifier
    outputs a probability; alerts are triggered above the threshold.
    """

    UPSET_THRESHOLD = 0.35

    def __init__(self, feature_names: Optional[list[str]] = None) -> None:
        self.feature_names = feature_names or []
        self.model = XGBClassifier(
            n_estimators=400,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            scale_pos_weight=2.0,  # upsets are the minority class
            reg_alpha=0.1,
            reg_lambda=1.0,
            min_child_weight=5,
            objective="binary:logistic",
            eval_metric="logloss",
            random_state=42,
            n_jobs=-1,
        )
        self._is_trained = False

    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray,
    ) -> None:
        self.model.fit(
            X_train,
            y_train,
            eval_set=[(X_val, y_val)],
            verbose=False,
        )
        self._is_trained = True

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Return upset probabilities (P(upset))."""
        if not self._is_trained:
            raise RuntimeError("Model has not been trained yet.")
        probas = self.model.predict_proba(X)
        # Column 1 = P(upset=1)
        return probas[:, 1]

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Return binary upset predictions using the threshold."""
        probas = self.predict_proba(X)
        return (probas >= self.UPSET_THRESHOLD).astype(int)

    def get_feature_importance(self) -> dict[str, float]:
        if not self._is_trained:
            return {}
        importances = self.model.feature_importances_
        if self.feature_names and len(self.feature_names) == len(importances):
            return {
                name: float(imp)
                for name, imp in zip(self.feature_names, importances)
            }
        return {f"f{i}": float(v) for i, v in enumerate(importances)}

    def save(self, path: str) -> None:
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        joblib.dump(
            {"model": self.model, "feature_names": self.feature_names},
            path,
        )

    def load(self, path: str) -> None:
        data = joblib.load(path)
        self.model = data["model"]
        self.feature_names = data.get("feature_names", [])
        self._is_trained = True


class EnsemblePredictor:
    """Combines spread, total, and upset models into a single prediction.

    Provides a unified interface for the API layer.
    """

    def __init__(
        self,
        spread_model: Optional[SpreadPredictor] = None,
        total_model: Optional[TotalPredictor] = None,
        upset_model: Optional[UpsetDetector] = None,
        feature_names: Optional[list[str]] = None,
    ) -> None:
        self.spread_model = spread_model
        self.total_model = total_model
        self.upset_model = upset_model
        self.feature_names = feature_names or []
        self.training_date: Optional[str] = None
        self.accuracy_metrics: dict = {}

    def predict_game(self, matchup_features: dict) -> dict:
        """Predict a single game given matchup features.

        Parameters
        ----------
        matchup_features : dict
            Output of FeatureEngineer.build_matchup_features().

        Returns
        -------
        dict with keys: spread, total, upset_prob, upset_alert,
        confidence, top_factors, home_win_prob.
        """
        from .feature_engineering import FeatureEngineer

        fe = FeatureEngineer()
        X = fe.features_to_array(matchup_features)

        spread = float(self.spread_model.predict(X)[0])
        total = float(self.total_model.predict(X)[0])
        upset_prob = float(self.upset_model.predict_proba(X)[0])

        # Confidence heuristic: higher when models agree and spread is large
        abs_spread = abs(spread)
        spread_confidence = min(abs_spread / 21.0, 1.0)
        upset_agreement = 1.0 - upset_prob if abs_spread > 7 else upset_prob
        confidence = round(0.6 * spread_confidence + 0.4 * upset_agreement, 3)

        # Home win probability derived from spread (logistic approximation)
        home_win_prob = round(1.0 / (1.0 + np.exp(-0.18 * spread)), 3)

        # Top contributing factors
        spread_imp = self.spread_model.get_feature_importance()
        top_factors = sorted(spread_imp.items(), key=lambda x: x[1], reverse=True)[:5]
        top_factors = [
            {"feature": name, "importance": round(imp, 4)}
            for name, imp in top_factors
        ]

        return {
            "spread": round(spread, 1),
            "total": round(total, 1),
            "upset_prob": round(upset_prob, 3),
            "upset_alert": upset_prob >= UpsetDetector.UPSET_THRESHOLD,
            "confidence": confidence,
            "home_win_prob": home_win_prob,
            "top_factors": top_factors,
        }

    def predict_batch(self, X: np.ndarray) -> dict:
        """Predict for a batch of matchups.

        Returns dict of arrays: spreads, totals, upset_probs.
        """
        return {
            "spreads": self.spread_model.predict(X),
            "totals": self.total_model.predict(X),
            "upset_probs": self.upset_model.predict_proba(X),
        }

    def save(self, output_dir: str) -> None:
        """Save all component models and metadata."""
        os.makedirs(output_dir, exist_ok=True)
        self.spread_model.save(os.path.join(output_dir, "spread_model.joblib"))
        self.total_model.save(os.path.join(output_dir, "total_model.joblib"))
        self.upset_model.save(os.path.join(output_dir, "upset_model.joblib"))

        meta = {
            "training_date": self.training_date or datetime.now(timezone.utc).isoformat(),
            "feature_names": self.feature_names,
            "accuracy_metrics": self.accuracy_metrics,
            "version": "1.0.0",
        }
        with open(os.path.join(output_dir, "model_meta.json"), "w") as f:
            json.dump(meta, f, indent=2)

    @classmethod
    def load(cls, model_dir: str) -> "EnsemblePredictor":
        """Load a saved ensemble from a directory."""
        meta_path = os.path.join(model_dir, "model_meta.json")
        with open(meta_path) as f:
            meta = json.load(f)

        feature_names = meta.get("feature_names", [])

        spread = SpreadPredictor(feature_names=feature_names)
        spread.load(os.path.join(model_dir, "spread_model.joblib"))

        total = TotalPredictor(feature_names=feature_names)
        total.load(os.path.join(model_dir, "total_model.joblib"))

        upset = UpsetDetector(feature_names=feature_names)
        upset.load(os.path.join(model_dir, "upset_model.joblib"))

        ensemble = cls(
            spread_model=spread,
            total_model=total,
            upset_model=upset,
            feature_names=feature_names,
        )
        ensemble.training_date = meta.get("training_date")
        ensemble.accuracy_metrics = meta.get("accuracy_metrics", {})
        return ensemble
