# AI Return Risk Manager

An end-to-end AI system that predicts the probability of an e-commerce

order being returned before shipment and helps merchants make cost-aware

risk decisions.

The application combines a React dashboard, Spring Boot decision

backend, Python machine-learning service, MongoDB audit storage,

explainable AI using SHAP, and a threshold optimization simulator.

## 🌐 Live Demo

Live Application:
https://ai-return-risk-frontend.onrender.com

GitHub Repository:
https://github.com/Vinyas212/AI-Return-Risk-Manager

### Cloud Deployment

The complete application is deployed using:

- React + Vite frontend — Render Static Site

- Spring Boot backend — Render Web Service using Docker

- Python FastAPI ML service — Render Web Service

- MongoDB Atlas — persistent audit and threshold storage

### Deployment Architecture

                     User / Recruiter
                           |
                           v
              +---------------------------+
              | React + Vite Frontend     |
              | Render Static Site        |
              +-------------+-------------+
                            |
                         REST API
                            |
                            v
              +---------------------------+
              | Spring Boot Backend       |
              | Render Docker Web Service |
              +----------+----------------+
                         / \
                        /   \
                       v     v
        +----------------+   +----------------+
        | FastAPI ML API |   | MongoDB Atlas  |
        | Random Forest  |   | Audit Trail    |
        | SHAP           |   | Risk Settings  |
        +----------------+   +----------------+

Render Free Tier Note: The backend and ML services may spin down after a period of inactivity. The first prediction after inactivity can therefore take around 50 seconds or more while the services wake up.

## Problem Statement

E-commerce returns can create significant losses through forward and

reverse shipping, restocking, damaged inventory, and lost sales. Most

merchants react only after a return occurs.

AI Return Risk Manager scores an order before shipment and estimates its

return risk so that a merchant can intervene earlier. The system also

allows the business to tune its decision threshold based on the relative

cost of false positives and missed returns.

## Core Features

-   Real-time return-risk scoring for individual orders

-   Risk probability and risk-level classification

-   Business decision: `FLAGGED` or `ALLOWED`

-   Per-order SHAP explanations showing which features push risk higher

    or lower

-   Top contributing risk factors

-   Configurable decision threshold

-   Cost-based threshold recommendation

-   What-if threshold impact simulator

-   Business savings dashboard

-   MongoDB-backed audit trail

-   Threshold-used tracking for every new decision

-   Frontend and backend input validation

-   Friendly API/network error handling

-   Admin-protected threshold changes

-   Configurable frontend CORS origin

-   MongoDB credentials stored outside source code

-   One-click local startup for all three application services

## Architecture

``` text

                         +----------------------+

                         |   React Dashboard    |

                         |   localhost:5173     |

                         +----------+-----------+

                                    |

                                    | REST API

                                    v

                         +----------------------+

                         | Spring Boot Backend  |

                         |   localhost:9090     |

                         +----+------------+----+

                              |            |

                     ML call  |            | Persistence

                              v            v

                  +----------------+   +----------------+

                  | Python ML API  |   | MongoDB Atlas  |

                  |  FastAPI       |   | Audit/Settings |

                  |  port 8000     |   +----------------+

                  +-------+--------+

                          |

                          v

                 Random Forest + SHAP

```

## End-to-End Flow

1.  A user enters order and customer-history information in the React

    dashboard.

2.  React sends the order to the Spring Boot scoring endpoint.

3.  Spring Boot sends the order features to the Python ML service.

4.  The ML model returns a risk score, risk level, contributing factors,

    and SHAP explanation.

5.  Spring Boot compares the risk score with the active business

    threshold.

6.  The order is marked `FLAGGED` or `ALLOWED`.

7.  The complete decision is stored in MongoDB.

8.  React displays the prediction, explanation, decision, and audit

    history.

## Technology Stack

### Frontend

-   React

-   Vite

-   JavaScript

-   CSS

### Backend

-   Java

-   Spring Boot

-   Spring MVC

-   Spring Security

-   Spring Validation

-   Spring Data MongoDB

-   Maven

### Machine Learning

-   Python

-   FastAPI

-   Uvicorn

-   scikit-learn

-   SHAP

-   NumPy

-   Random Forest classifier

### Database

-   MongoDB Atlas

## Project Structure

``` text

AI-Return-Risk-Manager/

|

+-- frontend/                 # React dashboard

|

+-- backend/                  # Spring Boot REST API

|

+-- ml-service/               # FastAPI ML service

|   +-- app.py

|   +-- model.pkl

|   +-- feature_cols.pkl

|   +-- threshold_curve.json

|

+-- start-project.bat         # Starts all three services

|

+-- README.md

```

## Order Features

The model currently accepts features such as:

-   Order value

-   Product category

-   Discount percentage

-   Payment method

-   Past orders

-   Past returns

-   Account age in days

-   City tier

-   Delivery days

-   Product rating

## Risk Decision Logic

The ML service produces a probability between `0` and `1`.

The Spring Boot backend compares that score against the active risk

threshold:

``` text

risk score >= active threshold  -> FLAGGED

risk score <  active threshold  -> ALLOWED

```

Risk level and business decision are intentionally separate concepts.

For example, an order can be classified as High Risk but still be

allowed when its risk score remains below the active business threshold.

## Explainable AI

The application uses local SHAP explanations for individual predictions.

For each scored order, the dashboard can show:

-   Feature name

-   Feature value

-   Relative contribution

-   Whether the feature pushed predicted return risk higher or lower

These explanations describe model behavior for the specific prediction.

They should not be interpreted as causal effects.

If a local SHAP explanation cannot be generated, the ML service can fall

back to global Random Forest feature importance.

## Threshold Optimization

A fixed probability threshold is not always the best business decision.

The dashboard allows the merchant to specify:

-   False-positive cost

-   Missed-return cost

For each candidate threshold, estimated decision cost is calculated as:

``` text

Total Cost =

(False Positives x False Positive Cost)

+

(False Negatives x Missed Return Cost)

```

The threshold with the lowest estimated cost is presented as the

recommended threshold.

## Threshold Impact Simulator

The What-If simulator allows the user to test different thresholds

without immediately changing the backend policy.

It displays the estimated effect on:

-   Flagged orders

-   Allowed orders

-   False positives

-   Missed returns

-   Precision

-   Recall

-   Estimated cost

## Business Savings Dashboard

The dashboard compares the active backend threshold against the

cost-optimal recommended threshold.

It reports metrics such as:

-   Current estimated loss

-   Optimized estimated loss

-   Potential savings

-   Cost reduction percentage

-   Returns caught under the current policy

-   Returns caught under the optimized policy

-   Additional returns potentially caught

These figures are estimates based on the held-out threshold evaluation

data and the user-supplied business costs.

## Audit Trail

Every scored order is persisted in MongoDB.

Recent audit records display:

-   Timestamp

-   Category

-   Payment method

-   Risk score

-   Threshold used

-   Risk level

-   Final decision

The dashboard retrieves the newest records first.

Older records created before threshold tracking was introduced may

display `—` for the threshold.

## Admin Threshold Protection

Reading the current threshold is public to the dashboard, but changing

the active threshold requires administrator authentication.

The protected operation is:

``` text

POST /api/orders/threshold

```

The current implementation uses Spring Security HTTP Basic

authentication for local/demo administration.

Admin credentials are loaded from environment variables and are not

hardcoded in the React application.

> For an internet-facing production deployment, replace this baseline

> authentication approach with an appropriate production

> identity/session/token solution and use HTTPS.

## Environment Variables

The backend expects these environment variables:

``` text

MONGODB_URI

APP_ADMIN_USERNAME

APP_ADMIN_PASSWORD

```

Do not commit real passwords, database credentials, API keys, or

connection strings to Git.

## Local Ports

  Service               Address

  --------------------- -------------------------

  React frontend        `http://localhost:5173`

  Spring Boot backend   `http://localhost:9090`

  Python ML service     `http://127.0.0.1:8000`

## Run the Complete Project

On Windows, the easiest method is to double-click:

``` text

start-project.bat

```

It starts:

``` text

Python ML service  -> port 8000

Spring Boot        -> port 9090

React frontend     -> port 5173

```

Then open:

``` text

http://localhost:5173

```

### Important

Make sure ports `5173`, `9090`, and `8000` are not already being used by

older copies of the project before running the starter.

## Manual Startup

If needed, each service can also be started separately.

### ML Service

``` powershell

cd ml**-**service

uvicorn app:app **--**reload **--**port 8000

```

### Spring Boot Backend

``` powershell

cd backend

.\mvnw.cmd spring**-**boot:run

```

### React Frontend

``` powershell

cd frontend

npm run dev

```

## Main API Endpoints

### Score an Order

``` text

POST /api/orders/score

```

### Get Audit Log

``` text

GET /api/orders/audit-log

```

### Read Active Threshold

``` text

GET /api/orders/threshold

```

### Update Active Threshold

``` text

POST /api/orders/threshold

```

The update endpoint requires administrator authentication.

## Validation

The application validates important business inputs including:

-   Order value must be greater than zero

-   Discount must be between 0 and 100

-   Past orders and returns cannot be negative

-   Past returns cannot exceed past orders

-   Account age cannot be negative

-   Delivery days cannot be negative

-   Product rating must be between 0 and 5

-   Risk threshold must remain between 0 and 1

Validation exists in both the user-facing frontend and backend API

boundary.

## Security Notes

-   MongoDB connection information is read from an environment variable.

-   Admin credentials are read from environment variables.

-   The threshold-changing endpoint is protected by Spring Security.

-   The frontend does not contain a hardcoded administrator password.

-   CORS origin is configurable in the Spring Boot application.

-   Secrets should never be committed to GitHub.

-   HTTPS should be used when deploying authenticated traffic beyond

    localhost.

## Model Performance

The dashboard currently presents held-out test metrics for the trained

model, including:

-   Precision

-   Recall

-   F1 score

-   ROC-AUC

Threshold-specific precision, recall, false-positive, and false-negative

values are also used by the business-cost simulator.

## Demo Flow

A simple demonstration sequence is:

1.  Start the project using `start-project.bat`.

2.  Open the React dashboard.

3.  Enter an order and click **Score this order**.

4.  Show the risk score and final decision.

5.  Explain the top factors and per-order SHAP analysis.

6.  Scroll to the Threshold Impact Simulator.

7.  Change false-positive and missed-return costs.

8.  Show how the recommended threshold changes.

9.  Apply a recommended threshold using administrator authentication.

10. Score another order and show the threshold used in the Audit Trail.

11. Show the Business Savings Dashboard.

## Current Scope

This project is a decision-support prototype. Estimated savings and

return-prevention figures are based on model evaluation data and

configured business-cost assumptions; they are not guaranteed financial

outcomes.

Potential future extensions include:

-   Production identity/OIDC authentication

-   Role-based merchant accounts

-   Batch CSV order scoring

-   Real-time e-commerce platform integration

-   Model monitoring and drift detection

-   Automated model retraining

-   CI/CD

-   Additional automated tests

## Summary

AI Return Risk Manager demonstrates how machine learning can be

connected to a practical business decision workflow rather than stopping

at a prediction.

It combines:

``` text

Prediction

+ Explainability

+ Cost-aware optimization

+ Secure policy changes

+ Persistent auditing

+ Business impact analysis

```

to help merchants identify potentially costly returns before orders are

shipped.