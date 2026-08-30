package com.riskmanager.return_risk_backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "risk_settings")
public class RiskSettings {

    @Id
    private String id;

    private double riskThreshold;

    public RiskSettings() {
    }

    public RiskSettings(String id, double riskThreshold) {
        this.id = id;
        this.riskThreshold = riskThreshold;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public double getRiskThreshold() {
        return riskThreshold;
    }

    public void setRiskThreshold(double riskThreshold) {
        this.riskThreshold = riskThreshold;
    }
}