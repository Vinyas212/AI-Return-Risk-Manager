package com.riskmanager.return_risk_backend.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public class ThresholdRequest {

    @NotNull(message = "Threshold is required")
    @DecimalMin(
            value = "0.0",
            message = "Threshold must be at least 0.0"
    )
    @DecimalMax(
            value = "1.0",
            message = "Threshold must not exceed 1.0"
    )
    private Double threshold;

    public ThresholdRequest() {
    }

    public Double getThreshold() {
        return threshold;
    }

    public void setThreshold(Double threshold) {
        this.threshold = threshold;
    }
}