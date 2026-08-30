"""
Synthetic e-commerce order dataset generator for the Return-Risk Scorer project.

Generates realistic-looking orders with a `returned` label (0/1), where the
label is correlated with features the way real returns behave:
  - COD orders return more than prepaid
  - Apparel/shoes return more than electronics/groceries
  - First-time customers and customers with a history of returns are riskier
  - Heavy discounts correlate with lower-intent purchases -> more returns
  - Non-metro delivery + long delivery time slightly raises risk

Run: python generate_data.py
Outputs: orders.csv (10,000 rows)
"""

import numpy as np
import pandas as pd

np.random.seed(42)
N = 10000

categories = ["Apparel", "Footwear", "Electronics", "Home", "Beauty", "Groceries", "Books"]
category_base_risk = {
    "Apparel": 0.35, "Footwear": 0.32, "Electronics": 0.12,
    "Home": 0.15, "Beauty": 0.10, "Groceries": 0.03, "Books": 0.05,
}

payment_methods = ["COD", "Prepaid"]
city_tiers = ["Metro", "Tier2", "Tier3"]

def generate_row():
    category = np.random.choice(categories)
    payment_method = np.random.choice(payment_methods, p=[0.45, 0.55])
    city_tier = np.random.choice(city_tiers, p=[0.5, 0.3, 0.2])

    order_value = round(np.random.gamma(shape=2.0, scale=800), 2)
    discount_pct = round(np.random.beta(2, 5) * 70, 1)  # skewed toward lower discounts
    past_orders = np.random.poisson(4)
    past_returns = min(np.random.poisson(0.6), past_orders)
    account_age_days = int(np.random.exponential(300))
    delivery_days = np.random.randint(1, 10)
    product_rating = round(np.random.normal(4.0, 0.6), 1)
    product_rating = min(max(product_rating, 1.0), 5.0)

    # --- base risk from category ---
    risk = category_base_risk[category]

    # --- adjust risk based on other features ---
    if payment_method == "COD":
        risk += 0.15
    if city_tier == "Tier3":
        risk += 0.05
    if discount_pct > 40:
        risk += 0.10
    if past_orders == 0:
        risk += 0.08  # first-time customers are riskier
    else:
        return_rate_hist = past_returns / max(past_orders, 1)
        risk += return_rate_hist * 0.3
    if delivery_days > 6:
        risk += 0.05
    if product_rating < 3.0:
        risk += 0.08

    risk = min(max(risk, 0.02), 0.95)  # clip to sane bounds
    returned = np.random.binomial(1, risk)

    return {
        "order_value": order_value,
        "category": category,
        "discount_pct": discount_pct,
        "payment_method": payment_method,
        "past_orders": past_orders,
        "past_returns": past_returns,
        "account_age_days": account_age_days,
        "city_tier": city_tier,
        "delivery_days": delivery_days,
        "product_rating": product_rating,
        "returned": returned,
    }

rows = [generate_row() for _ in range(N)]
df = pd.DataFrame(rows)
df.insert(0, "order_id", [f"ORD{100000+i}" for i in range(N)])

df.to_csv("orders.csv", index=False)
print(f"Generated {len(df)} orders -> orders.csv")
print(f"Overall return rate: {df['returned'].mean():.2%}")
print(df.groupby('category')['returned'].mean().sort_values(ascending=False))
