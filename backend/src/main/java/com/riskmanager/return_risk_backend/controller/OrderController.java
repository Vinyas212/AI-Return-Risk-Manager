package com.riskmanager.return_risk_backend.controller;

import com.riskmanager.return_risk_backend.dto.ThresholdRequest;
import com.riskmanager.return_risk_backend.model.DecisionRecord;
import com.riskmanager.return_risk_backend.model.Order;
import com.riskmanager.return_risk_backend.repository.DecisionRepository;
import com.riskmanager.return_risk_backend.service.DecisionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "${app.cors.allowed-origin}")
public class OrderController {

    private final DecisionService decisionService;
    private final DecisionRepository decisionRepository;

    public OrderController(
            DecisionService decisionService,
            DecisionRepository decisionRepository
    ) {
        this.decisionService = decisionService;
        this.decisionRepository = decisionRepository;
    }

    @PostMapping("/score")
    public DecisionRecord scoreOrder(
        @Valid @RequestBody Order order
    ) {
        return decisionService.scoreAndDecide(order);
    }

    @GetMapping("/audit-log")
    public List<DecisionRecord> getAuditLog() {
        return decisionRepository
                .findTop50ByOrderByTimestampDesc();
    }

    @GetMapping("/threshold")
    public double getThreshold() {
        return decisionService.getRiskThreshold();
    }

    @PostMapping("/threshold")
    public double updateThreshold(
            @Valid @RequestBody ThresholdRequest request
    ) {
        decisionService.setRiskThreshold(
                request.getThreshold()
        );

        return decisionService.getRiskThreshold();
    }
}