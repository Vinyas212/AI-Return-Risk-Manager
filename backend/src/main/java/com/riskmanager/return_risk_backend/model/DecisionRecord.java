package com.riskmanager.return_risk_backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "decisions")
public class DecisionRecord {

    @Id
    private String id;

    private Instant timestamp;

    private Order order;

    private double riskScore;

    private String riskLevel;

    /*
     * Boxed Double instead of primitive double.
     *
     * Older MongoDB records may not contain this field.
     * Using Double keeps missing values as null
     * instead of converting them to 0.0.
     */
    private Double thresholdUsed;

    private List<String> topContributingFactors;

    /*
     * Rich explainability data returned by the Python ML service.
     *
     * These are global Random Forest importance factors,
     * not per-order causal explanations.
     */
    private List<RiskPrediction.ModelInfluenceFactor>
            modelInfluenceFactors;

    private String explanationType;

    private String explanationNote;

    private String decision;

    private String decisionReason;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
    }

    public double getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(double riskScore) {
        this.riskScore = riskScore;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }

    public Double getThresholdUsed() {
        return thresholdUsed;
    }

    public void setThresholdUsed(Double thresholdUsed) {
        this.thresholdUsed = thresholdUsed;
    }

    public List<String> getTopContributingFactors() {
        return topContributingFactors;
    }

    public void setTopContributingFactors(
            List<String> topContributingFactors
    ) {
        this.topContributingFactors =
                topContributingFactors;
    }

    public List<RiskPrediction.ModelInfluenceFactor>
            getModelInfluenceFactors() {

        return modelInfluenceFactors;
    }

    public void setModelInfluenceFactors(
            List<RiskPrediction.ModelInfluenceFactor>
                    modelInfluenceFactors
    ) {

        this.modelInfluenceFactors =
                modelInfluenceFactors;
    }

    public String getExplanationType() {
        return explanationType;
    }

    public void setExplanationType(
            String explanationType
    ) {
        this.explanationType =
                explanationType;
    }

    public String getExplanationNote() {
        return explanationNote;
    }

    public void setExplanationNote(
            String explanationNote
    ) {
        this.explanationNote =
                explanationNote;
    }

    public String getDecision() {
        return decision;
    }

    public void setDecision(String decision) {
        this.decision = decision;
    }

    public String getDecisionReason() {
        return decisionReason;
    }

    public void setDecisionReason(
            String decisionReason
    ) {
        this.decisionReason =
                decisionReason;
    }
}