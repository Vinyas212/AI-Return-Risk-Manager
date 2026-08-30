package com.riskmanager.return_risk_backend.service;

import com.riskmanager.return_risk_backend.model.Order;
import com.riskmanager.return_risk_backend.model.RiskPrediction;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * This class's ONLY job is to talk to your Python ML service.
 * Nothing else in this app needs to know HOW the risk score is
 * calculated — it just asks this class for a prediction and gets one back.
 * This separation is good practice: if you ever swap out the ML service,
 * only this file needs to change.
 *
 * @Service tells Spring "create one instance of this class automatically
 * and let other classes borrow it" — you'll see this pattern a lot.
 *
 * PUT THIS FILE AT:
 * src/main/java/com/riskmanager/returnriskbackend/service/MlServiceClient.java
 * (create the "service" folder if it doesn't exist yet)
 */
@Service
public class MlServiceClient {

    // Reads ml.service.url from application.properties, so it's not
    // hardcoded — you can change the address without touching this code.
    @Value("${ml.service.url}")
    private String mlServiceUrl;

    // RestTemplate is Spring's tool for making HTTP calls to other services.
    private final RestTemplate restTemplate = new RestTemplate();

    public RiskPrediction getPrediction(Order order) {
        String endpoint = mlServiceUrl + "/predict";
        // postForObject: send `order` as the request body (as JSON),
        // and convert the JSON response into a RiskPrediction object.
        return restTemplate.postForObject(endpoint, order, RiskPrediction.class);
    }
}