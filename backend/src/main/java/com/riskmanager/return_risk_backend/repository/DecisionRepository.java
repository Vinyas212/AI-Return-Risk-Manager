package com.riskmanager.return_risk_backend.repository;

import com.riskmanager.return_risk_backend.model.DecisionRecord;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

/**
 * This repository manages DecisionRecord objects in MongoDB.
 *
 * By extending MongoRepository, this interface automatically gets
 * methods like:
 *
 * save()
 * findAll()
 * findById()
 * deleteById()
 *
 * Spring Data MongoDB generates the implementation automatically.
 *
 * <DecisionRecord, String> means:
 * - DecisionRecord = the model/document this repository manages
 * - String = the data type of the DecisionRecord ID
 *
 * File location:
 * src/main/java/com/riskmanager/return_risk_backend/repository/DecisionRepository.java
 */
public interface DecisionRepository
        extends MongoRepository<DecisionRecord, String> {

    /**
     * Returns only the newest 50 audit records.
     *
     * Spring understands this method name automatically:
     *
     * Top50      -> return maximum 50 records
     * OrderBy    -> sort the results
     * Timestamp  -> use the timestamp field
     * Desc       -> newest records first
     */
    List<DecisionRecord> findTop50ByOrderByTimestampDesc();
}