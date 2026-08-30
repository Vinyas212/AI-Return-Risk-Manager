"""
app.py

Runs the trained return-risk model as a FastAPI service.

Main endpoints:

POST /predict
    Receives one order and returns:
    - risk score
    - risk level
    - top local SHAP factors
    - per-order explainability information

GET /threshold-curve
    Returns threshold performance data used by the
    React Threshold Impact Simulator.

GET /
    Simple health check.
"""

import json
import logging

import joblib
import numpy as np
import pandas as pd
import shap

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# ===============================================================
# LOGGING
# ===============================================================

logger = logging.getLogger(__name__)


# ===============================================================
# LOAD MODEL
# ===============================================================

model = joblib.load("model.pkl")

feature_cols = joblib.load(
    "feature_cols.pkl"
)

# TreeExplainer is designed for tree-based models such as
# Random Forest and is fast enough for this API use case.
shap_explainer = shap.TreeExplainer(model)


# ===============================================================
# FASTAPI APP
# ===============================================================

app = FastAPI(
    title="Return-Risk Scorer API"
)


# ===============================================================
# CORS
# ===============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===============================================================
# REQUEST MODEL
# ===============================================================

class Order(BaseModel):

    order_value: float

    category: str

    discount_pct: float

    payment_method: str

    past_orders: int

    past_returns: int

    account_age_days: int

    city_tier: str

    delivery_days: int

    product_rating: float


# ===============================================================
# HUMAN-READABLE FEATURE NAME
# ===============================================================

def get_feature_label(feature_name):

    labels = {

        "order_value":
            "Order value",

        "discount_pct":
            "Discount percentage",

        "past_orders":
            "Previous orders",

        "past_returns":
            "Previous returns",

        "account_age_days":
            "Account age",

        "delivery_days":
            "Delivery time",

        "product_rating":
            "Product rating",
    }

    if feature_name in labels:

        return labels[feature_name]

    if feature_name.startswith(
        "category_"
    ):

        value = feature_name.replace(
            "category_",
            ""
        )

        return f"Category: {value}"

    if feature_name.startswith(
        "payment_method_"
    ):

        value = feature_name.replace(
            "payment_method_",
            ""
        )

        return f"Payment: {value}"

    if feature_name.startswith(
        "city_tier_"
    ):

        value = feature_name.replace(
            "city_tier_",
            ""
        )

        return f"City tier: {value}"

    return feature_name.replace(
        "_",
        " "
    ).title()


# ===============================================================
# FEATURE VALUE FOR THIS ORDER
# ===============================================================

def get_order_feature_value(
    feature_name,
    order
):

    if feature_name == "order_value":

        return f"₹{order.order_value:,.0f}"

    if feature_name == "discount_pct":

        return f"{order.discount_pct:.0f}%"

    if feature_name == "past_orders":

        return str(
            order.past_orders
        )

    if feature_name == "past_returns":

        return str(
            order.past_returns
        )

    if feature_name == "account_age_days":

        return (
            f"{order.account_age_days} days"
        )

    if feature_name == "delivery_days":

        return (
            f"{order.delivery_days} days"
        )

    if feature_name == "product_rating":

        return (
            f"{order.product_rating:.1f}/5"
        )

    if feature_name.startswith(
        "category_"
    ):

        category = feature_name.replace(
            "category_",
            ""
        )

        return (
            "Yes"
            if order.category == category
            else "No"
        )

    if feature_name.startswith(
        "payment_method_"
    ):

        payment = feature_name.replace(
            "payment_method_",
            ""
        )

        return (
            "Yes"
            if order.payment_method == payment
            else "No"
        )

    if feature_name.startswith(
        "city_tier_"
    ):

        tier = feature_name.replace(
            "city_tier_",
            ""
        )

        return (
            "Yes"
            if order.city_tier == tier
            else "No"
        )

    return "Available"


# ===============================================================
# SHAP OUTPUT NORMALIZATION
# ===============================================================

def get_return_class_shap_values(
    row_encoded
):
    """
    Returns one SHAP value per feature for the
    positive class: return-risk class 1.

    Different SHAP versions can return slightly
    different array shapes for classifiers, so
    this function handles the common formats.
    """

    raw_shap_values = (
        shap_explainer.shap_values(
            row_encoded
        )
    )

    # Older SHAP versions may return:
    # [class_0_values, class_1_values]
    if isinstance(
        raw_shap_values,
        list
    ):

        class_values = (
            raw_shap_values[1]
            if len(raw_shap_values) > 1
            else raw_shap_values[0]
        )

        values = np.asarray(
            class_values,
            dtype=float
        )

        if values.ndim == 2:

            return values[0]

        return values.reshape(-1)

    values = np.asarray(
        raw_shap_values,
        dtype=float
    )

    # Newer SHAP versions commonly return:
    # (samples, features, classes)
    if values.ndim == 3:

        if values.shape[2] > 1:

            return values[0, :, 1]

        return values[0, :, 0]

    # Regression-like / single-output format:
    # (samples, features)
    if values.ndim == 2:

        return values[0]

    if values.ndim == 1:

        return values

    raise ValueError(
        "Unexpected SHAP output shape: "
        f"{values.shape}"
    )


# ===============================================================
# LOCAL SHAP EXPLANATION TEXT
# ===============================================================

def get_local_shap_explanation(
    feature_name,
    order,
    shap_value
):

    label = get_feature_label(
        feature_name
    )

    value = get_order_feature_value(
        feature_name,
        order
    )

    if shap_value > 0:

        direction_text = (
            "pushes this order toward higher "
            "predicted return risk"
        )

    elif shap_value < 0:

        direction_text = (
            "pushes this order toward lower "
            "predicted return risk"
        )

    else:

        direction_text = (
            "has almost no effect on this "
            "order's predicted return risk"
        )

    return (
        f"{label} ({value}) {direction_text} "
        f"for this specific prediction."
    )


# ===============================================================
# BUILD LOCAL SHAP EXPLANATIONS
# ===============================================================

def build_local_shap_explanations(
    order,
    row_encoded
):

    shap_values = (
        get_return_class_shap_values(
            row_encoded
        )
    )

    shap_series = pd.Series(
        shap_values,
        index=feature_cols,
        dtype=float
    )

    absolute_values = (
        shap_series.abs()
    )

    total_absolute_effect = float(
        absolute_values.sum()
    )

    top_features = (
        absolute_values
        .sort_values(
            ascending=False
        )
        .head(3)
        .index
        .tolist()
    )

    explanations = []

    for feature in top_features:

        shap_value = float(
            shap_series[feature]
        )

        absolute_effect = abs(
            shap_value
        )

        if total_absolute_effect > 0:

            importance_percent = (
                absolute_effect /
                total_absolute_effect
            ) * 100

        else:

            importance_percent = 0.0

        explanations.append({

            # Keep these existing field names so the
            # current Spring Boot DTO keeps working.
            "feature":
                feature,

            "label":
                get_feature_label(
                    feature
                ),

            "value":
                get_order_feature_value(
                    feature,
                    order
                ),

            # For local SHAP, "importance" is the
            # absolute SHAP magnitude for this order.
            "importance":
                round(
                    absolute_effect,
                    4
                ),

            # Percentage of this order's total
            # absolute SHAP contribution.
            "importance_percent":
                round(
                    importance_percent,
                    1
                ),

            # Direction is explained in the text so
            # we do not add a new JSON property that
            # could break the existing Java DTO.
            "explanation":
                get_local_shap_explanation(
                    feature,
                    order,
                    shap_value
                ),

            "scope":
                (
                    "local_shap_higher_risk"
                    if shap_value > 0
                    else
                    "local_shap_lower_risk"
                    if shap_value < 0
                    else
                    "local_shap_neutral"
                ),
        })

    return (
        top_features,
        explanations
    )


# ===============================================================
# GLOBAL IMPORTANCE FALLBACK
# ===============================================================

def build_global_fallback(
    order
):

    importances = pd.Series(
        model.feature_importances_,
        index=feature_cols,
        dtype=float
    )

    top_features = (
        importances
        .sort_values(
            ascending=False
        )
        .head(3)
        .index
        .tolist()
    )

    total_importance = float(
        importances.sum()
    )

    explanations = []

    for feature in top_features:

        raw_importance = float(
            importances[feature]
        )

        if total_importance > 0:

            importance_percent = (
                raw_importance /
                total_importance
            ) * 100

        else:

            importance_percent = 0.0

        explanations.append({

            "feature":
                feature,

            "label":
                get_feature_label(
                    feature
                ),

            "value":
                get_order_feature_value(
                    feature,
                    order
                ),

            "importance":
                round(
                    raw_importance,
                    4
                ),

            "importance_percent":
                round(
                    importance_percent,
                    1
                ),

            "explanation":
                (
                    f"{get_feature_label(feature)} "
                    "is globally important to the "
                    "Random Forest model. Local SHAP "
                    "explanation was unavailable for "
                    "this request."
                ),

            "scope":
                "global_model_importance",
        })

    return (
        top_features,
        explanations
    )


# ===============================================================
# PREDICTION ENDPOINT
# ===============================================================

@app.post("/predict")
def predict(order: Order):

    # Convert request into one-row DataFrame

    row = pd.DataFrame([
        order.model_dump()
    ])


    # -----------------------------------------------------------
    # ONE-HOT ENCODING
    # -----------------------------------------------------------

    row_encoded = pd.get_dummies(
        row,
        columns=[
            "category",
            "payment_method",
            "city_tier",
        ]
    )


    # -----------------------------------------------------------
    # MATCH TRAINING COLUMNS
    # -----------------------------------------------------------

    for col in feature_cols:

        if col not in row_encoded.columns:

            row_encoded[col] = 0


    row_encoded = row_encoded[
        feature_cols
    ]


    # -----------------------------------------------------------
    # RISK SCORE
    # -----------------------------------------------------------

    probabilities = (
        model.predict_proba(
            row_encoded
        )
    )

    risk_score = float(
        probabilities[0][1]
    )


    # -----------------------------------------------------------
    # TRUE PER-ORDER SHAP EXPLANATION
    # -----------------------------------------------------------

    explanation_type = (
        "local_shap"
    )

    explanation_note = (
        "These factors are SHAP-based local "
        "explanations for this specific order. "
        "Positive effects push predicted return "
        "risk higher; negative effects push it lower."
    )

    try:

        (
            top_features,
            explanations
        ) = build_local_shap_explanations(
            order,
            row_encoded
        )

    except Exception as shap_error:

        # Keep scoring available even if SHAP ever
        # fails because of an environment/version issue.
        logger.exception(
            "SHAP explanation failed. Using global fallback: %s",
            shap_error
        )

        (
            top_features,
            explanations
        ) = build_global_fallback(
            order
        )

        explanation_type = (
            "global_model_importance_fallback"
        )

        explanation_note = (
            "Local SHAP explanation was unavailable, "
            "so these factors show global Random "
            "Forest feature importance instead."
        )


    # -----------------------------------------------------------
    # RISK LEVEL
    # -----------------------------------------------------------

    if risk_score > 0.5:

        risk_level = "High"

    elif risk_score > 0.3:

        risk_level = "Medium"

    else:

        risk_level = "Low"


    # -----------------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------------

    return {

        "risk_score":
            round(
                risk_score,
                3
            ),

        "risk_level":
            risk_level,

        # Kept for compatibility with the existing
        # Spring Boot backend and React dashboard.
        "top_contributing_factors":
            top_features,

        # Same JSON structure as before, but when
        # SHAP succeeds these are now LOCAL factors.
        "model_influence_factors":
            explanations,

        "explanation_type":
            explanation_type,

        "explanation_note":
            explanation_note,
    }


# ===============================================================
# HEALTH CHECK
# ===============================================================

@app.get("/")
def health_check():

    return {
        "status":
            "Return-Risk Scorer API is running"
    }


# ===============================================================
# THRESHOLD CURVE
# ===============================================================

@app.get("/threshold-curve")
def threshold_curve():

    """
    Returns threshold performance information
    used by the React cost and threshold simulator.

    The file contains precision, recall and
    TP/FP/TN/FN values measured on the held-out
    test dataset.
    """

    with open(
        "threshold_curve.json"
    ) as file:

        return json.load(file)