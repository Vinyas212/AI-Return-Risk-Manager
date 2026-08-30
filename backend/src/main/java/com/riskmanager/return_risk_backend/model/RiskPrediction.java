package com.riskmanager.return_risk_backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class RiskPrediction {

    @JsonProperty("risk_score")
    private double riskScore;

    @JsonProperty("risk_level")
    private String riskLevel;

    @JsonProperty("top_contributing_factors")
    private List<String> topContributingFactors;

    @JsonProperty("model_influence_factors")
    private List<ModelInfluenceFactor> modelInfluenceFactors;

    @JsonProperty("explanation_type")
    private String explanationType;

    @JsonProperty("explanation_note")
    private String explanationNote;

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

    public List<String> getTopContributingFactors() {
        return topContributingFactors;
    }

    public void setTopContributingFactors(
            List<String> topContributingFactors
    ) {
        this.topContributingFactors = topContributingFactors;
    }

    public List<ModelInfluenceFactor> getModelInfluenceFactors() {
        return modelInfluenceFactors;
    }

    public void setModelInfluenceFactors(
            List<ModelInfluenceFactor> modelInfluenceFactors
    ) {
        this.modelInfluenceFactors = modelInfluenceFactors;
    }

    public String getExplanationType() {
        return explanationType;
    }

    public void setExplanationType(String explanationType) {
        this.explanationType = explanationType;
    }

    public String getExplanationNote() {
        return explanationNote;
    }

    public void setExplanationNote(String explanationNote) {
        this.explanationNote = explanationNote;
    }

    public static class ModelInfluenceFactor {

        private String feature;

        private String label;

        private String value;

        private double importance;

        @JsonProperty("importance_percent")
        private double importancePercent;

        private String explanation;

        private String scope;

        public String getFeature() {
            return feature;
        }

        public void setFeature(String feature) {
            this.feature = feature;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public String getValue() {
            return value;
        }

        public void setValue(String value) {
            this.value = value;
        }

        public double getImportance() {
            return importance;
        }

        public void setImportance(double importance) {
            this.importance = importance;
        }

        public double getImportancePercent() {
            return importancePercent;
        }

        public void setImportancePercent(double importancePercent) {
            this.importancePercent = importancePercent;
        }

        public String getExplanation() {
            return explanation;
        }

        public void setExplanation(String explanation) {
            this.explanation = explanation;
        }

        public String getScope() {
            return scope;
        }

        public void setScope(String scope) {
            this.scope = scope;
        }
    }
}