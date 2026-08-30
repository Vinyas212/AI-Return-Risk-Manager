package com.riskmanager.return_risk_backend.service;

import com.riskmanager.return_risk_backend.model.DecisionRecord;
import com.riskmanager.return_risk_backend.model.Order;
import com.riskmanager.return_risk_backend.model.RiskPrediction;
import com.riskmanager.return_risk_backend.model.RiskSettings;
import com.riskmanager.return_risk_backend.repository.DecisionRepository;
import com.riskmanager.return_risk_backend.repository.RiskSettingsRepository;

import jakarta.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class DecisionService {

    private static final Logger logger =
            LoggerFactory.getLogger(DecisionService.class);

    private final MlServiceClient mlServiceClient;
    private final DecisionRepository decisionRepository;
    private final RiskSettingsRepository riskSettingsRepository;

    @Value("${risk.threshold:0.5}")
    private double riskThreshold;

    public DecisionService(
            MlServiceClient mlServiceClient,
            DecisionRepository decisionRepository,
            RiskSettingsRepository riskSettingsRepository
    ) {
        this.mlServiceClient = mlServiceClient;
        this.decisionRepository = decisionRepository;
        this.riskSettingsRepository = riskSettingsRepository;
    }

    @PostConstruct
    public void loadSavedThreshold() {

        RiskSettings settings =
                riskSettingsRepository
                        .findById("global")
                        .orElse(null);

        if (settings != null) {

            riskThreshold =
                    settings.getRiskThreshold();

            logger.info(
                    "Loaded saved risk threshold: {}",
                    riskThreshold
            );

        } else {

            RiskSettings defaultSettings =
                    new RiskSettings(
                            "global",
                            riskThreshold
                    );

            riskSettingsRepository.save(
                    defaultSettings
            );

            logger.info(
                    "Saved default risk threshold: {}",
                    riskThreshold
            );
        }
    }

    public DecisionRecord scoreAndDecide(
            Order order
    ) {

        if (order.getPastReturns() > order.getPastOrders()) {

            throw new IllegalArgumentException(
                    "Past returns cannot be greater than past orders"
            );
        }

        RiskPrediction prediction =
                mlServiceClient.getPrediction(
                        order
                );

        boolean flagged =
                prediction.getRiskScore()
                        >= riskThreshold;

        String decision =
                flagged
                        ? "FLAGGED"
                        : "ALLOWED";

        String reason;

        if (flagged) {

            reason =
                    "Risk score "
                            + prediction.getRiskScore()
                            + " met/exceeded threshold "
                            + riskThreshold
                            + ". Top factors: "
                            + prediction.getTopContributingFactors();

        } else {

            reason =
                    "Risk score "
                            + prediction.getRiskScore()
                            + " below threshold "
                            + riskThreshold
                            + ". Order allowed normally.";
        }

        DecisionRecord record =
                new DecisionRecord();

        record.setTimestamp(
                Instant.now()
        );

        record.setOrder(
                order
        );

        record.setRiskScore(
                prediction.getRiskScore()
        );

        record.setRiskLevel(
                prediction.getRiskLevel()
        );

        record.setThresholdUsed(
                riskThreshold
        );

        record.setTopContributingFactors(
                prediction.getTopContributingFactors()
        );

        record.setModelInfluenceFactors(
                prediction.getModelInfluenceFactors()
        );

        record.setExplanationType(
                prediction.getExplanationType()
        );

        record.setExplanationNote(
                prediction.getExplanationNote()
        );

        record.setDecision(
                decision
        );

        record.setDecisionReason(
                reason
        );

        DecisionRecord savedRecord =
                decisionRepository.save(
                        record
                );

        logger.info(
                "Order scored. Risk score: {}, threshold: {}, decision: {}",
                prediction.getRiskScore(),
                riskThreshold,
                decision
        );

        return savedRecord;
    }

    public double getRiskThreshold() {
        return riskThreshold;
    }

    public void setRiskThreshold(
            double riskThreshold
    ) {

        if (
                riskThreshold < 0.0
                        || riskThreshold > 1.0
        ) {

            throw new IllegalArgumentException(
                    "Risk threshold must be between 0.0 and 1.0"
            );
        }

        RiskSettings settings =
                new RiskSettings(
                        "global",
                        riskThreshold
                );

        /*
         * Persist first.
         *
         * If MongoDB saving fails,
         * the running threshold remains unchanged.
         */
        riskSettingsRepository.save(
                settings
        );

        this.riskThreshold =
                riskThreshold;

        logger.info(
                "Risk threshold updated and saved: {}",
                riskThreshold
        );
    }
}