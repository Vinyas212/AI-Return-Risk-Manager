import { useState, useEffect } from 'react'
import './App.css'

// Spring Boot backend
const API_BASE =
  import.meta.env.VITE_API_BASE || 'http://localhost:9090/api/orders'

// Python ML service
const ML_API_BASE =
  import.meta.env.VITE_ML_API_BASE || 'http://127.0.0.1:8000'

const MODEL_METRICS = {
  precision: 0.46,
  recall: 0.63,
  f1: 0.53,
  auc: 0.70,
  testSetSize: 2000,
}

const CATEGORIES = [
  'Apparel',
  'Footwear',
  'Electronics',
  'Home',
  'Beauty',
  'Groceries',
  'Books',
]

const CITY_TIERS = ['Metro', 'Tier2', 'Tier3']

function App() {
  // ================= ORDER FORM =================

  const [form, setForm] = useState({
    order_value: 1200,
    category: 'Apparel',
    discount_pct: 45,
    payment_method: 'COD',
    past_orders: 0,
    past_returns: 0,
    account_age_days: 5,
    city_tier: 'Tier3',
    delivery_days: 7,
    product_rating: 3.2,
  })

  // ================= ORDER SCORING =================

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [validationErrors, setValidationErrors] = useState([])

  // ================= AUDIT LOG =================

  const [auditLog, setAuditLog] = useState([])
  const [logLoading, setLogLoading] = useState(true)

  // ================= THRESHOLD / COST SIMULATOR =================

  const [thresholdCurve, setThresholdCurve] = useState([])
  const [thresholdLoading, setThresholdLoading] =
    useState(true)

  const [thresholdError, setThresholdError] =
    useState(null)

  const [falsePositiveCost, setFalsePositiveCost] =
    useState(50)

  const [falseNegativeCost, setFalseNegativeCost] =
    useState(500)

  // User-selected threshold for What-If Simulator
  const [simulatedThreshold, setSimulatedThreshold] =
    useState(0.5)

  // Actual threshold currently used by Spring Boot
  const [activeThreshold, setActiveThreshold] =
    useState(null)

  const [thresholdUpdating, setThresholdUpdating] =
    useState(false)

  const [
    thresholdUpdateError,
    setThresholdUpdateError,
  ] = useState(null)

  // ================= INITIAL PAGE LOAD =================

  useEffect(() => {
    loadAuditLog()
    loadThresholdCurve()
    loadActiveThreshold()
  }, [])

  // ================= AUDIT LOG =================

  async function loadAuditLog() {
    setLogLoading(true)

    try {
      const res = await fetch(
        `${API_BASE}/audit-log`
      )

      if (!res.ok) {
        throw new Error(
          `Audit log responded with ${res.status}`
        )
      }

      const data = await res.json()

      setAuditLog(data)
    } catch (err) {
      console.error(
        'Failed to load audit log',
        err
      )
    } finally {
      setLogLoading(false)
    }
  }

  // ================= THRESHOLD CURVE =================

  async function loadThresholdCurve() {
    setThresholdLoading(true)
    setThresholdError(null)

    try {
      const res = await fetch(
        `${ML_API_BASE}/threshold-curve`
      )

      if (!res.ok) {
        throw new Error(
          `Threshold API responded with ${res.status}`
        )
      }

      const data = await res.json()

      if (!Array.isArray(data)) {
        throw new Error(
          'Threshold API returned invalid data'
        )
      }

      setThresholdCurve(data)
    } catch (err) {
      console.error(
        'Failed to load threshold curve',
        err
      )

      setThresholdError(
        'Could not load threshold curve from the ML service.'
      )
    } finally {
      setThresholdLoading(false)
    }
  }

  // ================= ACTIVE BACKEND THRESHOLD =================

  async function loadActiveThreshold() {
    try {
      setThresholdUpdateError(null)

      const res = await fetch(
        `${API_BASE}/threshold`
      )

      if (!res.ok) {
        throw new Error(
          `Threshold endpoint responded with ${res.status}`
        )
      }

      const data = await res.json()

      const numericThreshold = Number(data)

      setActiveThreshold(numericThreshold)

      setSimulatedThreshold(
        numericThreshold
      )
    } catch (err) {
      console.error(
        'Failed to load active threshold',
        err
      )

      setThresholdUpdateError(
        'Could not load the active backend threshold.'
      )
    }
  }

  // ================= FORM UPDATE =================

  function updateField(field, value) {
    setForm(previousForm => ({
      ...previousForm,
      [field]: value,
    }))
  }

  // ================= FORM VALIDATION =================

  function validateOrderForm() {
    const errors = []

    if (!Number.isFinite(form.order_value) || form.order_value <= 0) {
      errors.push('Order value must be greater than ₹0.')
    }

    if (
      !Number.isFinite(form.discount_pct) ||
      form.discount_pct < 0 ||
      form.discount_pct > 100
    ) {
      errors.push('Discount must be between 0% and 100%.')
    }

    if (
      !Number.isInteger(form.past_orders) ||
      form.past_orders < 0
    ) {
      errors.push('Past orders must be a whole number of 0 or more.')
    }

    if (
      !Number.isInteger(form.past_returns) ||
      form.past_returns < 0
    ) {
      errors.push('Past returns must be a whole number of 0 or more.')
    }

    if (form.past_returns > form.past_orders) {
      errors.push('Past returns cannot be greater than past orders.')
    }

    if (
      !Number.isInteger(form.account_age_days) ||
      form.account_age_days < 0
    ) {
      errors.push('Account age must be a whole number of 0 days or more.')
    }

    if (
      !Number.isInteger(form.delivery_days) ||
      form.delivery_days < 0
    ) {
      errors.push('Delivery days must be a whole number of 0 days or more.')
    }

    if (
      !Number.isFinite(form.product_rating) ||
      form.product_rating < 0 ||
      form.product_rating > 5
    ) {
      errors.push('Product rating must be between 0 and 5.')
    }

    return errors
  }

  // ================= SCORE ORDER =================

  async function scoreOrder() {
    const errors = validateOrderForm()

    if (errors.length > 0) {
      setValidationErrors(errors)
      setError(null)
      return
    }

    setValidationErrors([])
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `${API_BASE}/score`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify(form),
        }
      )

      if (!res.ok) {
        let message =
          `Scoring service responded with ${res.status}`

        try {
          const errorData = await res.json()

          if (errorData.message) {
            message = errorData.message
          }
        } catch {
          // Backend response was not JSON.
        }

        throw new Error(message)
      }

      const data = await res.json()

      setResult(data)

      await loadAuditLog()

    } catch (err) {
      console.error(
        'Failed to score order',
        err
      )

      if (err instanceof TypeError) {
        setError(
          'Could not reach the scoring service. Is your Spring Boot backend running on port 9090?'
        )
      } else {
        setError(
          err.message ||
            'Could not score this order.'
        )
      }

    } finally {
      setLoading(false)
    }
  }

  // ================= THRESHOLD CALCULATIONS =================

  const thresholdResults =
    thresholdCurve.map(point => ({
      ...point,

      totalCost:
        point.falsePositives *
          falsePositiveCost +
        point.falseNegatives *
          falseNegativeCost,
    }))

  const recommendedThreshold =
    thresholdResults.length > 0
      ? thresholdResults.reduce(
          (best, current) =>
            current.totalCost <
            best.totalCost
              ? current
              : best
        )
      : null

  // ================= SIMULATED THRESHOLD RESULT =================

  const simulatedResult =
    thresholdResults.length > 0
      ? thresholdResults.reduce(
          (closest, current) => {
            const currentDifference =
              Math.abs(
                current.threshold -
                  simulatedThreshold
              )

            const closestDifference =
              Math.abs(
                closest.threshold -
                  simulatedThreshold
              )

            return currentDifference <
              closestDifference
              ? current
              : closest
          }
        )
      : null

  // ================= ACTIVE THRESHOLD RESULT =================

  const activeThresholdResult =
    activeThreshold !== null &&
    thresholdResults.length > 0
      ? thresholdResults.reduce(
          (closest, current) => {
            const currentDifference =
              Math.abs(
                current.threshold -
                  activeThreshold
              )

            const closestDifference =
              Math.abs(
                closest.threshold -
                  activeThreshold
              )

            return currentDifference <
              closestDifference
              ? current
              : closest
          }
        )
      : null

  // ================= WHAT-IF BUSINESS IMPACT =================

  const simulatedFlaggedOrders =
    simulatedResult
      ? simulatedResult.truePositives +
        simulatedResult.falsePositives
      : 0

  const simulatedAllowedOrders =
    simulatedResult
      ? simulatedResult.trueNegatives +
        simulatedResult.falseNegatives
      : 0

  const simulatedTotalOrders =
    simulatedResult
      ? simulatedFlaggedOrders +
        simulatedAllowedOrders
      : 0

  const estimatedSavingsVsActive =
    simulatedResult &&
    activeThresholdResult
      ? activeThresholdResult.totalCost -
        simulatedResult.totalCost
      : 0

  // ================= BUSINESS SAVINGS DASHBOARD =================

  const recommendedSavings =
    recommendedThreshold &&
    activeThresholdResult
      ? activeThresholdResult.totalCost -
        recommendedThreshold.totalCost
      : 0

  const recommendedSavingsPercent =
    recommendedThreshold &&
    activeThresholdResult &&
    activeThresholdResult.totalCost > 0
      ? (
          recommendedSavings /
          activeThresholdResult.totalCost
        ) * 100
      : 0

  const recommendedReturnsCaught =
    recommendedThreshold
      ? recommendedThreshold.truePositives
      : 0

  const activeReturnsCaught =
    activeThresholdResult
      ? activeThresholdResult.truePositives
      : 0

  const additionalReturnsCaught =
    recommendedReturnsCaught -
    activeReturnsCaught

  const activeEstimatedLoss =
    activeThresholdResult
      ? activeThresholdResult.totalCost
      : 0

  const optimizedEstimatedLoss =
    recommendedThreshold
      ? recommendedThreshold.totalCost
      : 0

  // ================= APPLY RECOMMENDED THRESHOLD =================

  async function applyRecommendedThreshold() {
    if (!recommendedThreshold) {
      return
    }

    const adminUsername = window.prompt(
      'Enter admin username'
    )

    if (!adminUsername) {
      return
    }

    const adminPassword = window.prompt(
      'Enter admin password'
    )

    if (!adminPassword) {
      return
    }

    setThresholdUpdating(true)
    setThresholdUpdateError(null)

    try {
      const credentials = btoa(
        `${adminUsername}:${adminPassword}`
      )

      const res = await fetch(
        `${API_BASE}/threshold`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${credentials}`,
          },

          body: JSON.stringify({
            threshold:
              recommendedThreshold.threshold,
          }),
        }
      )

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error(
            'Incorrect admin username or password.'
          )
        }

        if (res.status === 403) {
          throw new Error(
            'You are not authorized to change the threshold.'
          )
        }

        let message =
          `Threshold update responded with ${res.status}`

        try {
          const errorData = await res.json()

          if (errorData.message) {
            message = errorData.message
          }
        } catch {
          // Backend response was not JSON.
        }

        throw new Error(message)
      }

      const data = await res.json()

      const newThreshold = Number(data)

      setActiveThreshold(newThreshold)

      setSimulatedThreshold(
        newThreshold
      )

    } catch (err) {
      console.error(
        'Failed to update active threshold',
        err
      )

      if (err instanceof TypeError) {
        setThresholdUpdateError(
          'Could not reach the backend service.'
        )
      } else {
        setThresholdUpdateError(
          err.message ||
            'Could not apply the recommended threshold.'
        )
      }

    } finally {
      setThresholdUpdating(false)
    }
  }

  // ================= UI =================

  return (
    <div className="app">

      {/* ================= HEADER ================= */}

      <header className="app-header">

        <div className="header-eyebrow">
          RETURN-RISK SCORER
        </div>

        <h1>
          Order Risk Console
        </h1>

        <p className="header-sub">
          Score incoming orders for return risk
          before they ship.
        </p>

      </header>

      {/* ================= MAIN GRID ================= */}

      <div className="grid">

        {/* ================= ORDER FORM ================= */}

        <section className="panel">

          <h2 className="panel-title">
            Score an order
          </h2>

          <div className="field-grid">

            <label className="field">

              <span>
                Order value (₹)
              </span>

              <input
                type="number"
                min="0"
                value={form.order_value}
                onChange={e =>
                  updateField(
                    'order_value',
                    Number(
                      e.target.value
                    )
                  )
                }
              />

            </label>

            <label className="field">

              <span>
                Category
              </span>

              <select
                value={form.category}
                onChange={e =>
                  updateField(
                    'category',
                    e.target.value
                  )
                }
              >

                {CATEGORIES.map(
                  category => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  )
                )}

              </select>

            </label>

            <label className="field">

              <span>
                Discount %
              </span>

              <input
                type="number"
                min="0"
                max="100"
                value={
                  form.discount_pct
                }
                onChange={e =>
                  updateField(
                    'discount_pct',
                    Number(
                      e.target.value
                    )
                  )
                }
              />

            </label>

            <label className="field">

              <span>
                Payment method
              </span>

              <select
                value={
                  form.payment_method
                }
                onChange={e =>
                  updateField(
                    'payment_method',
                    e.target.value
                  )
                }
              >

                <option value="COD">
                  COD
                </option>

                <option value="Prepaid">
                  Prepaid
                </option>

              </select>

            </label>

            <label className="field">

              <span>
                Past orders
              </span>

              <input
                type="number"
                min="0"
                value={
                  form.past_orders
                }
                onChange={e =>
                  updateField(
                    'past_orders',
                    Number(
                      e.target.value
                    )
                  )
                }
              />

            </label>

            <label className="field">

              <span>
                Past returns
              </span>

              <input
                type="number"
                min="0"
                value={
                  form.past_returns
                }
                onChange={e =>
                  updateField(
                    'past_returns',
                    Number(
                      e.target.value
                    )
                  )
                }
              />

            </label>

            <label className="field">

              <span>
                Account age (days)
              </span>

              <input
                type="number"
                min="0"
                value={
                  form.account_age_days
                }
                onChange={e =>
                  updateField(
                    'account_age_days',
                    Number(
                      e.target.value
                    )
                  )
                }
              />

            </label>

            <label className="field">

              <span>
                City tier
              </span>

              <select
                value={
                  form.city_tier
                }
                onChange={e =>
                  updateField(
                    'city_tier',
                    e.target.value
                  )
                }
              >

                {CITY_TIERS.map(
                  tier => (
                    <option
                      key={tier}
                      value={tier}
                    >
                      {tier}
                    </option>
                  )
                )}

              </select>

            </label>

            <label className="field">

              <span>
                Delivery days
              </span>

              <input
                type="number"
                min="0"
                value={
                  form.delivery_days
                }
                onChange={e =>
                  updateField(
                    'delivery_days',
                    Number(
                      e.target.value
                    )
                  )
                }
              />

            </label>

            <label className="field">

              <span>
                Product rating
              </span>

              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={
                  form.product_rating
                }
                onChange={e =>
                  updateField(
                    'product_rating',
                    Number(
                      e.target.value
                    )
                  )
                }
              />

            </label>

          </div>

          {validationErrors.length > 0 && (
            <div className="error-text">
              <strong>Please correct the following:</strong>
              <ul style={{ marginBottom: 0 }}>
                {validationErrors.map((validationError, index) => (
                  <li key={`${validationError}-${index}`}>
                    {validationError}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            className="score-btn"
            onClick={scoreOrder}
            disabled={loading}
          >

            {loading
              ? 'Scoring…'
              : 'Score this order'}

          </button>

          {error && (
            <p className="error-text">
              {error}
            </p>
          )}

        </section>

        {/* ================= RESULT ================= */}

        <section className="panel">

          <h2 className="panel-title">
            Result
          </h2>

          {!result && (
            <p className="empty-state">
              Score an order to see its
              risk result here.
            </p>
          )}

          {result && (

            <div
              className={`result-card level-${result.riskLevel.toLowerCase()}`}
            >

              <div className="result-top">

                <span className="risk-level-badge">
                  {result.riskLevel} RISK
                </span>

                <span className="decision-badge">
                  {result.decision}
                </span>

              </div>

              <div className="score-number">

                {(
                  result.riskScore *
                  100
                ).toFixed(1)}
                %

              </div>

              <div className="meter-track">

                <div
                  className="meter-fill"
                  style={{
                    width:
                      `${
                        result.riskScore *
                        100
                      }%`,
                  }}
                />

              </div>

              <p className="result-reason">
                {
                  result.decisionReason
                }
              </p>

              <div className="factors">

                <span className="factors-label">
                  Top factors
                </span>

                <div className="factor-chips">

                  {result
                    .topContributingFactors
                    ?.map(
                      factor => (

                        <span
                          key={factor}
                          className="chip"
                        >

                          {factor
                            .replace(
                              'category_',
                              ''
                            )
                            .replaceAll(
                              '_',
                              ' '
                            )}

                        </span>

                      )
                    )}

                </div>

              </div>

              {/* ================= EXPLAINABLE AI ================= */}

              {result.modelInfluenceFactors &&
                result.modelInfluenceFactors.length > 0 && (

                  <div
                    className="result-card"
                    style={{
                      marginTop: '20px',
                    }}
                  >

                    <div className="result-top">

                      <span className="risk-level-badge">
                        EXPLAINABLE AI
                      </span>

                      <span className="decision-badge">
                        {result.explanationType === 'local_shap'
                          ? 'PER-ORDER SHAP'
                          : 'MODEL INFLUENCE'}
                      </span>

                    </div>

                    <h2 className="panel-title metrics-title">
                      {result.explanationType === 'local_shap'
                        ? 'Why this order received this risk score'
                        : 'Why the model pays attention to these features'}
                    </h2>

                    <p className="metrics-note">
                      {result.explanationNote}
                    </p>

                    {result.modelInfluenceFactors.map(
                      (factor, index) => {

                        const pushesHigher =
                          factor.scope === 'local_shap_higher_risk'

                        const pushesLower =
                          factor.scope === 'local_shap_lower_risk'

                        const isLocalShap =
                          pushesHigher ||
                          pushesLower ||
                          factor.scope === 'local_shap_neutral'

                        return (
                          <div
                            key={factor.feature || index}
                            style={{
                              marginTop: index === 0 ? '16px' : '14px',
                              padding: '16px',
                              border: '1px solid #263244',
                              borderRadius: '12px',
                              background: '#111823',
                            }}
                          >

                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                gap: '12px',
                                marginBottom: '8px',
                              }}
                            >

                              <div>

                                <strong>
                                  {factor.label}
                                </strong>

                                <div
                                  className="metrics-note"
                                  style={{
                                    marginTop: '4px',
                                    marginBottom: '0',
                                  }}
                                >
                                  Value: {factor.value}
                                </div>

                              </div>

                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-end',
                                  gap: '6px',
                                }}
                              >

                                {isLocalShap && (
                                  <span
                                    style={{
                                      fontSize: '12px',
                                      fontWeight: '700',
                                      padding: '4px 8px',
                                      borderRadius: '999px',
                                      border: '1px solid #344258',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {pushesHigher
                                      ? '↑ PUSHES RISK HIGHER'
                                      : pushesLower
                                        ? '↓ PUSHES RISK LOWER'
                                        : 'NEUTRAL EFFECT'}
                                  </span>
                                )}

                                <strong>
                                  {factor.importance_percent}%
                                </strong>

                              </div>

                            </div>

                            <div
                              className="meter-track"
                              style={{
                                marginBottom: '10px',
                              }}
                            >

                              <div
                                className="meter-fill"
                                style={{
                                  width: `${Math.min(
                                    factor.importance_percent * 3,
                                    100
                                  )}%`,
                                }}
                              />

                            </div>

                            <p
                              className="result-reason"
                              style={{
                                margin: '0',
                              }}
                            >
                              {factor.explanation}
                            </p>

                          </div>
                        )
                      }
                    )}

                    <p
                      className="metrics-note"
                      style={{
                        marginTop: '16px',
                        marginBottom: '0',
                      }}
                    >
                      <strong>Explanation type:</strong>{' '}

                      {result.explanationType === 'local_shap'
                        ? (
                          <>
                            Per-order SHAP attribution. These values show
                            how features pushed this specific prediction
                            higher or lower relative to the model baseline.
                            They are model explanations, not causal effects.
                          </>
                        )
                        : (
                          <>
                            Global Random Forest feature importance.
                            These values describe overall model influence,
                            not per-order causal effects.
                          </>
                        )}

                    </p>

                  </div>

                )}

            </div>

          )}

          {/* ================= MODEL PERFORMANCE ================= */}

          <h2 className="panel-title metrics-title">
            Model performance
          </h2>

          <div className="metrics-grid">

            <div className="metric">

              <span className="metric-value">

                {(
                  MODEL_METRICS.precision *
                  100
                ).toFixed(0)}
                %

              </span>

              <span className="metric-label">
                Precision
              </span>

            </div>

            <div className="metric">

              <span className="metric-value">

                {(
                  MODEL_METRICS.recall *
                  100
                ).toFixed(0)}
                %

              </span>

              <span className="metric-label">
                Recall
              </span>

            </div>

            <div className="metric">

              <span className="metric-value">

                {(
                  MODEL_METRICS.f1 *
                  100
                ).toFixed(0)}
                %

              </span>

              <span className="metric-label">
                F1 score
              </span>

            </div>

            <div className="metric">

              <span className="metric-value">
                {
                  MODEL_METRICS.auc
                    .toFixed(2)
                }
              </span>

              <span className="metric-label">
                ROC-AUC
              </span>

            </div>

          </div>

          <p className="metrics-note">

            Measured on a{' '}

            {
              MODEL_METRICS
                .testSetSize
                .toLocaleString()
            }

            -order held-out test set.

          </p>

        </section>

      </div>

      {/* ================= THRESHOLD IMPACT SIMULATOR ================= */}

      <section className="panel log-panel">

        <h2 className="panel-title">
          Threshold Impact Simulator
        </h2>

        <p className="metrics-note">

          Change business costs and
          manually test different risk
          thresholds. The simulator shows
          how each threshold changes
          flagged orders, missed returns,
          precision, recall and estimated
          cost.

        </p>

        {/* ================= COST INPUTS ================= */}

        <div className="field-grid">

          <label className="field">

            <span>
              False positive cost (₹)
            </span>

            <input
              type="number"
              min="0"
              value={
                falsePositiveCost
              }
              onChange={e =>
                setFalsePositiveCost(
                  Math.max(
                    0,
                    Number(
                      e.target.value
                    )
                  )
                )
              }
            />

          </label>

          <label className="field">

            <span>
              Missed return cost (₹)
            </span>

            <input
              type="number"
              min="0"
              value={
                falseNegativeCost
              }
              onChange={e =>
                setFalseNegativeCost(
                  Math.max(
                    0,
                    Number(
                      e.target.value
                    )
                  )
                )
              }
            />

          </label>

        </div>

        {thresholdLoading && (

          <p className="empty-state">
            Loading threshold data…
          </p>

        )}

        {thresholdError && (

          <p className="error-text">
            {thresholdError}
          </p>

        )}

        {thresholdUpdateError && (

          <p className="error-text">
            {thresholdUpdateError}
          </p>

        )}

        {/* ================= WHAT-IF SIMULATOR ================= */}

        {!thresholdLoading &&
          !thresholdError &&
          simulatedResult && (

            <div className="result-card">

              <div className="result-top">

                <span className="risk-level-badge">
                  WHAT-IF THRESHOLD
                </span>

                {activeThreshold !== null && (

                  <span className="decision-badge">

                    ACTIVE{' '}

                    {(
                      activeThreshold *
                      100
                    ).toFixed(0)}

                    %

                  </span>

                )}

              </div>

              <div className="score-number">

                {(
                  simulatedResult
                    .threshold *
                  100
                ).toFixed(0)}

                %

              </div>

              {/* ================= THRESHOLD SLIDER ================= */}

              <label
                className="field"
                style={{
                  marginTop: '16px',
                  display: 'block',
                }}
              >

                <span>

                  Test threshold:{' '}

                  <strong>

                    {(
                      simulatedThreshold *
                      100
                    ).toFixed(0)}

                    %

                  </strong>

                </span>

                <input
                  type="range"
                  min="0.05"
                  max="0.95"
                  step="0.05"
                  value={
                    simulatedThreshold
                  }
                  onChange={e =>
                    setSimulatedThreshold(
                      Number(
                        e.target.value
                      )
                    )
                  }
                  style={{
                    width: '100%',
                    marginTop: '12px',
                  }}
                />

              </label>

              {/* ================= BUSINESS IMPACT ================= */}

              <h2 className="panel-title metrics-title">
                Business impact
              </h2>

              <div className="metrics-grid">

                <div className="metric">

                  <span className="metric-value">

                    {
                      simulatedFlaggedOrders
                        .toLocaleString()
                    }

                  </span>

                  <span className="metric-label">
                    Flagged orders
                  </span>

                </div>

                <div className="metric">

                  <span className="metric-value">

                    {
                      simulatedAllowedOrders
                        .toLocaleString()
                    }

                  </span>

                  <span className="metric-label">
                    Allowed orders
                  </span>

                </div>

                <div className="metric">

                  <span className="metric-value">

                    ₹

                    {
                      simulatedResult
                        .totalCost
                        .toLocaleString()
                    }

                  </span>

                  <span className="metric-label">
                    Estimated cost
                  </span>

                </div>

                <div className="metric">

                  <span className="metric-value">

                    {
                      simulatedResult
                        .falseNegatives
                        .toLocaleString()
                    }

                  </span>

                  <span className="metric-label">
                    Missed returns
                  </span>

                </div>

              </div>

              {/* ================= PREDICTION IMPACT ================= */}

              <h2 className="panel-title metrics-title">
                Prediction impact
              </h2>

              <div className="metrics-grid">

                <div className="metric">

                  <span className="metric-value">

                    {(
                      simulatedResult
                        .precision *
                      100
                    ).toFixed(1)}

                    %

                  </span>

                  <span className="metric-label">
                    Precision
                  </span>

                </div>

                <div className="metric">

                  <span className="metric-value">

                    {(
                      simulatedResult
                        .recall *
                      100
                    ).toFixed(1)}

                    %

                  </span>

                  <span className="metric-label">
                    Recall
                  </span>

                </div>

                <div className="metric">

                  <span className="metric-value">

                    {
                      simulatedResult
                        .falsePositives
                        .toLocaleString()
                    }

                  </span>

                  <span className="metric-label">
                    False positives
                  </span>

                </div>

                <div className="metric">

                  <span className="metric-value">

                    {
                      simulatedTotalOrders
                        .toLocaleString()
                    }

                  </span>

                  <span className="metric-label">
                    Test orders
                  </span>

                </div>

              </div>

              {/* ================= ACTIVE COMPARISON ================= */}

              {activeThresholdResult && (

                <p className="metrics-note">

                  Compared with the active
                  backend threshold of{' '}

                  <strong>

                    {(
                      activeThreshold *
                      100
                    ).toFixed(0)}

                    %

                  </strong>

                  , this simulated threshold
                  would{' '}

                  {estimatedSavingsVsActive >
                  0 ? (

                    <>

                      reduce estimated cost by{' '}

                      <strong>

                        ₹

                        {
                          estimatedSavingsVsActive
                            .toLocaleString()
                        }

                      </strong>

                    </>

                  ) :
                  estimatedSavingsVsActive <
                  0 ? (

                    <>

                      increase estimated cost by{' '}

                      <strong>

                        ₹

                        {
                          Math.abs(
                            estimatedSavingsVsActive
                          ).toLocaleString()
                        }

                      </strong>

                    </>

                  ) : (

                    <>
                      produce the same
                      estimated cost.
                    </>

                  )}

                </p>

              )}

            </div>

          )}

        {/* ================= RECOMMENDED THRESHOLD ================= */}

        {!thresholdLoading &&
          !thresholdError &&
          recommendedThreshold && (

            <div
              className="result-card"
              style={{
                marginTop: '20px',
              }}
            >

              <div className="result-top">

                <span className="risk-level-badge">
                  LOWEST-COST RECOMMENDATION
                </span>

              </div>

              <div className="score-number">

                {(
                  recommendedThreshold
                    .threshold *
                  100
                ).toFixed(0)}

                %

              </div>

              <div className="metrics-grid">

                <div className="metric">

                  <span className="metric-value">

                    ₹

                    {
                      recommendedThreshold
                        .totalCost
                        .toLocaleString()
                    }

                  </span>

                  <span className="metric-label">
                    Estimated cost
                  </span>

                </div>

                <div className="metric">

                  <span className="metric-value">

                    {(
                      recommendedThreshold
                        .precision *
                      100
                    ).toFixed(1)}

                    %

                  </span>

                  <span className="metric-label">
                    Precision
                  </span>

                </div>

                <div className="metric">

                  <span className="metric-value">

                    {(
                      recommendedThreshold
                        .recall *
                      100
                    ).toFixed(1)}

                    %

                  </span>

                  <span className="metric-label">
                    Recall
                  </span>

                </div>

                <div className="metric">

                  <span className="metric-value">

                    {
                      recommendedThreshold
                        .falseNegatives
                    }

                  </span>

                  <span className="metric-label">
                    Missed returns
                  </span>

                </div>

              </div>

              {activeThreshold !== null && (

                <p className="metrics-note">

                  Active backend threshold:{' '}

                  <strong>

                    {(
                      activeThreshold *
                      100
                    ).toFixed(0)}

                    %

                  </strong>

                </p>

              )}

              <button
                className="score-btn"
                onClick={
                  applyRecommendedThreshold
                }
                disabled={
                  thresholdUpdating ||
                  activeThreshold === null ||
                  Math.abs(
                    activeThreshold -
                      recommendedThreshold
                        .threshold
                  ) < 0.000001
                }
              >

                {thresholdUpdating
                  ? 'Applying threshold…'
                  : activeThreshold !==
                        null &&
                      Math.abs(
                        activeThreshold -
                          recommendedThreshold
                            .threshold
                      ) < 0.000001
                    ? 'Recommended threshold is active'
                    : `Apply ${(
                        recommendedThreshold
                          .threshold *
                        100
                      ).toFixed(
                        0
                      )}% Threshold`}

              </button>

            </div>

          )}

      </section>

      {/* ================= BUSINESS SAVINGS DASHBOARD ================= */}

      {!thresholdLoading &&
        !thresholdError &&
        recommendedThreshold &&
        activeThresholdResult && (

          <section className="panel log-panel">

            <h2 className="panel-title">
              Business Savings Dashboard
            </h2>

            <p className="metrics-note">

              Estimated financial impact of
              moving from the current backend
              threshold to the lowest-cost
              recommended threshold.

            </p>

            <div className="metrics-grid">

              {/* CURRENT LOSS */}

              <div className="metric">

                <span className="metric-value">

                  ₹
                  {
                    activeEstimatedLoss
                      .toLocaleString()
                  }

                </span>

                <span className="metric-label">
                  Current estimated loss
                </span>

              </div>

              {/* OPTIMIZED LOSS */}

              <div className="metric">

                <span className="metric-value">

                  ₹
                  {
                    optimizedEstimatedLoss
                      .toLocaleString()
                  }

                </span>

                <span className="metric-label">
                  Optimized estimated loss
                </span>

              </div>

              {/* SAVINGS */}

              <div className="metric">

                <span className="metric-value">

                  ₹
                  {
                    Math.max(
                      0,
                      recommendedSavings
                    ).toLocaleString()
                  }

                </span>

                <span className="metric-label">
                  Potential savings
                </span>

              </div>

              {/* SAVINGS PERCENT */}

              <div className="metric">

                <span className="metric-value">

                  {
                    Math.max(
                      0,
                      recommendedSavingsPercent
                    ).toFixed(1)
                  }

                  %

                </span>

                <span className="metric-label">
                  Cost reduction
                </span>

              </div>

            </div>

            <h2 className="panel-title metrics-title">
              Return prevention impact
            </h2>

            <div className="metrics-grid">

              {/* CURRENT RETURNS CAUGHT */}

              <div className="metric">

                <span className="metric-value">

                  {
                    activeReturnsCaught
                      .toLocaleString()
                  }

                </span>

                <span className="metric-label">
                  Returns caught now
                </span>

              </div>

              {/* OPTIMIZED RETURNS CAUGHT */}

              <div className="metric">

                <span className="metric-value">

                  {
                    recommendedReturnsCaught
                      .toLocaleString()
                  }

                </span>

                <span className="metric-label">
                  Returns caught optimized
                </span>

              </div>

              {/* EXTRA RETURNS CAUGHT */}

              <div className="metric">

                <span className="metric-value">

                  {
                    additionalReturnsCaught >=
                    0
                      ? `+${additionalReturnsCaught.toLocaleString()}`
                      : additionalReturnsCaught.toLocaleString()
                  }

                </span>

                <span className="metric-label">
                  Additional returns caught
                </span>

              </div>

              {/* OPTIMAL THRESHOLD */}

              <div className="metric">

                <span className="metric-value">

                  {(
                    recommendedThreshold
                      .threshold *
                    100
                  ).toFixed(0)}

                  %

                </span>

                <span className="metric-label">
                  Recommended threshold
                </span>

              </div>

            </div>

            {/* ================= EXECUTIVE SUMMARY ================= */}

            <div
              className="result-card"
              style={{
                marginTop: '20px',
              }}
            >

              <div className="result-top">

                <span className="risk-level-badge">
                  BUSINESS SUMMARY
                </span>

              </div>

              <p className="result-reason">

                Moving the decision threshold
                from{' '}

                <strong>

                  {(
                    activeThreshold *
                    100
                  ).toFixed(0)}

                  %

                </strong>

                {' '}to{' '}

                <strong>

                  {(
                    recommendedThreshold
                      .threshold *
                    100
                  ).toFixed(0)}

                  %

                </strong>

                {' '}would reduce estimated
                decision cost from{' '}

                <strong>

                  ₹
                  {
                    activeEstimatedLoss
                      .toLocaleString()
                  }

                </strong>

                {' '}to{' '}

                <strong>

                  ₹
                  {
                    optimizedEstimatedLoss
                      .toLocaleString()
                  }

                </strong>

                .

                {recommendedSavings > 0 && (

                  <>

                    {' '}That represents
                    potential savings of{' '}

                    <strong>

                      ₹
                      {
                        recommendedSavings
                          .toLocaleString()
                      }

                    </strong>

                    {' '}or approximately{' '}

                    <strong>

                      {
                        recommendedSavingsPercent
                          .toFixed(1)
                      }

                      %

                    </strong>

                    {' '}of the current
                    estimated cost.

                  </>

                )}

                {additionalReturnsCaught > 0 && (

                  <>

                    {' '}The optimized policy
                    would also identify{' '}

                    <strong>

                      {
                        additionalReturnsCaught
                          .toLocaleString()
                      }

                    </strong>

                    {' '}additional likely
                    returns in the test
                    population.

                  </>

                )}

              </p>

            </div>

          </section>

        )}

      {/* ================= AUDIT TRAIL ================= */}

      <section className="panel log-panel">

        <div className="log-header">

          <h2 className="panel-title">
            Audit trail
          </h2>

          <button
            className="refresh-btn"
            onClick={loadAuditLog}
          >

            Refresh

          </button>

        </div>

        {logLoading && (

          <p className="empty-state">
            Loading…
          </p>

        )}

        {!logLoading &&
          auditLog.length === 0 && (

            <p className="empty-state">

              No orders scored yet.
              Score one above to see it here.

            </p>

          )}

        {!logLoading &&
          auditLog.length > 0 && (

            <div className="table-wrap">

              <table>

                <thead>

                  <tr>

                    <th>Time</th>
                    <th>Category</th>
                    <th>Payment</th>
                    <th>Score</th>
                    <th>Threshold</th>
                    <th>Level</th>
                    <th>Decision</th>

                  </tr>

                </thead>

                <tbody>

                  {auditLog.map(
                    entry => (

                      <tr key={entry.id}>

                        <td>

                          {
                            new Date(
                              entry.timestamp
                            ).toLocaleTimeString()
                          }

                        </td>

                        <td>

                          {
                            entry.order
                              ?.category
                          }

                        </td>

                        <td>

                          {
                            entry.order
                              ?.payment_method
                          }

                        </td>

                        <td>

                          {(
                            entry.riskScore *
                            100
                          ).toFixed(1)}

                          %

                        </td>

                        <td>

                          {entry.thresholdUsed !=
                          null
                            ? `${(
                                entry.thresholdUsed *
                                100
                              ).toFixed(0)}%`
                            : '—'}

                        </td>

                        <td>

                          <span
                            className={`pill level-${entry.riskLevel.toLowerCase()}`}
                          >

                            {
                              entry.riskLevel
                            }

                          </span>

                        </td>

                        <td>

                          {
                            entry.decision
                          }

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

      </section>

    </div>
  )
}

export default App