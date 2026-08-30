"""
train_model.py — trains the Return-Risk model on orders.csv

WHAT THIS SCRIPT DOES (in plain English):
1. Loads the orders you generated earlier
2. Converts text columns (like "Apparel", "COD") into numbers
3. Splits data into a training set and a test set
4. Trains a Random Forest classifier to predict `returned` (0 or 1)
5. Tests the model and prints precision, recall, F1, and a confusion matrix
6. Shows which features mattered most
7. Saves the trained model to a file (model.pkl) so other code can reuse it

Run this AFTER generate_data.py has created orders.csv in the same folder.

    python train_model.py
"""

import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)

# ---------------------------------------------------------------
# STEP 1: Load the data
# ---------------------------------------------------------------
df = pd.read_csv("orders.csv")
print(f"Loaded {len(df)} orders")

# ---------------------------------------------------------------
# STEP 2: Turn text columns into numbers ("encoding")
# ---------------------------------------------------------------
# pd.get_dummies turns a column like "category" (Apparel/Footwear/...)
# into several 0/1 columns, e.g. category_Apparel, category_Footwear, etc.
# This is called "one-hot encoding" — models can't read text directly.
df_encoded = pd.get_dummies(
    df,
    columns=["category", "payment_method", "city_tier"],
    drop_first=False
)

# The columns we'll feed the model (everything except IDs and the label itself)
feature_cols = [c for c in df_encoded.columns if c not in ("order_id", "returned")]
X = df_encoded[feature_cols]   # X = the inputs (features)
y = df_encoded["returned"]     # y = the answer we want to predict (label)

# ---------------------------------------------------------------
# STEP 3: Split into training set and test set
# ---------------------------------------------------------------
# test_size=0.2 means 20% of orders are held back to test on.
# random_state=42 just makes the split reproducible (same split every run).
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"Training on {len(X_train)} orders, testing on {len(X_test)} orders")

# ---------------------------------------------------------------
# STEP 4: Train the model
# ---------------------------------------------------------------
# n_estimators=200 -> the "forest" has 200 decision trees voting together
# class_weight="balanced" -> since returns are ~32% of data (not 50/50),
#   this tells the model to not just lazily predict "not returned" every time
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=8,
    class_weight="balanced",
    random_state=42
)
model.fit(X_train, y_train)
print("Model trained.")

# ---------------------------------------------------------------
# STEP 5: Test the model and print honest metrics
# ---------------------------------------------------------------
y_pred = model.predict(X_test)            # hard 0/1 predictions
y_proba = model.predict_proba(X_test)[:, 1]  # risk score between 0 and 1

precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)
auc = roc_auc_score(y_test, y_proba)
cm = confusion_matrix(y_test, y_pred)

print("\n--- MODEL PERFORMANCE (on unseen test data) ---")
print(f"Precision: {precision:.3f}  (of orders we flagged as risky, how many actually were)")
print(f"Recall:    {recall:.3f}  (of orders that were actually returned, how many we caught)")
print(f"F1 score:  {f1:.3f}")
print(f"ROC-AUC:   {auc:.3f}  (0.5 = random guessing, 1.0 = perfect)")
print("\nConfusion matrix:")
print("                Predicted: No Return | Predicted: Return")
print(f"Actual: No Return        {cm[0][0]:>6}         |      {cm[0][1]:>6}")
print(f"Actual: Return           {cm[1][0]:>6}         |      {cm[1][1]:>6}")

print("\nFull report:")
print(classification_report(y_test, y_pred, target_names=["Not Returned", "Returned"]))

# ---------------------------------------------------------------
# STEP 6: Which features mattered most (explainability)
# ---------------------------------------------------------------
importances = pd.Series(model.feature_importances_, index=feature_cols)
importances = importances.sort_values(ascending=False)
print("\n--- TOP 10 FEATURES DRIVING RISK PREDICTIONS ---")
print(importances.head(10))

# ---------------------------------------------------------------
# STEP 7: Save the trained model for later use (by the API service)
# ---------------------------------------------------------------
joblib.dump(model, "model.pkl")
joblib.dump(feature_cols, "feature_cols.pkl")  # save column order too — important!
print("\nSaved model.pkl and feature_cols.pkl")
