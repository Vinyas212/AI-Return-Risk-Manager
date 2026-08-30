package com.riskmanager.return_risk_backend.repository;

import com.riskmanager.return_risk_backend.model.RiskSettings;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface RiskSettingsRepository extends MongoRepository<RiskSettings, String> {
}