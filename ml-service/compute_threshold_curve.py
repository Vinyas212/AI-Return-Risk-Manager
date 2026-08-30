"""
compute_threshold_curve.py — this powers the cost-aware simulator on
your dashboard.

WHAT THIS DOES, IN PLAIN ENGLISH:
Your model doesn't just say "returned" or "not returned" — it gives a
probability (like 0.568). Right now your app.py picks ONE fixed cutoff
(0.5) to turn that probability into a flag/allow decision. But the
"right" cutoff actually depends on business costs: how bad is it to
wrongly flag a good customer, versus how bad is it to miss a real
return risk?

This script tests MANY possible cutoffs (0.05, 0.10, 0.15, ... 0.95)
against your held-out test set, and for each one records exactly how
many orders would be: correctly flagged, wrongly flagged, correctly
allowed, wrongly allowed. That table is what lets the dashboard
calculate, LIVE, which cutoff is cheapest for whatever cost numbers
the user types in.

Run this AFTER train_model.py has already created model.pkl.

    python compute_threshold_curve.py

Outputs: threshold_curve.json
"""

import pandas as pd
import joblib
import json
from sklearn.model_selection import train_test_split

# Load the same model and the same data split used during training,
# so these numbers are genuinely from unseen test data (not the data
# the model was trained on).
model = joblib.load("model.pkl")
feature_cols = joblib.load("feature_cols.pkl")

df = pd.read_csv("orders.csv")
df_encoded = pd.get_dummies(df, columns=["category", "payment_method", "city_tier"], drop_first=False)

X = df_encoded[feature_cols]
y = df_encoded["returned"]

# Same random_state=42 and test_size=0.2 as train_model.py — this
# recreates the EXACT same test set that was held out during training.
_, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Get the model's predicted probability for every test order
probabilities = model.predict_proba(X_test)[:, 1]

curve = []
for threshold in [i / 100 for i in range(5, 100, 5)]:  # 0.05, 0.10, ..., 0.95
    predicted_flag = (probabilities >= threshold).astype(int)

    true_positives = int(((predicted_flag == 1) & (y_test == 1)).sum())   # correctly flagged
    false_positives = int(((predicted_flag == 1) & (y_test == 0)).sum()) # wrongly flagged (annoyed a good customer)
    true_negatives = int(((predicted_flag == 0) & (y_test == 0)).sum())  # correctly allowed
    false_negatives = int(((predicted_flag == 0) & (y_test == 1)).sum()) # missed a real return risk

    precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0
    recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0

    curve.append({
        "threshold": round(threshold, 2),
        "truePositives": true_positives,
        "falsePositives": false_positives,
        "trueNegatives": true_negatives,
        "falseNegatives": false_negatives,
        "precision": round(precision, 3),
        "recall": round(recall, 3),
    })

with open("threshold_curve.json", "w") as f:
    json.dump(curve, f, indent=2)

print(f"Computed {len(curve)} threshold points -> threshold_curve.json")
print(f"Test set size: {len(y_test)} orders ({int(y_test.sum())} actually returned)")