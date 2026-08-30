package com.riskmanager.return_risk_backend.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.SimpleMongoClientDatabaseFactory;

/**
 * We define the MongoDB connection explicitly here instead of relying on
 * Spring Boot's auto-configuration to read spring.data.mongodb.uri.
 * This guarantees our Atlas connection string is actually used, and gives
 * us a single obvious place to look if the database connection ever needs
 * debugging.
 *
 * PUT THIS FILE AT:
 * src/main/java/com/riskmanager/return_risk_backend/config/MongoConfig.java
 * (create the "config" folder if it doesn't exist yet, as a sibling of
 * controller, model, repository, service)
 */
@Configuration
public class MongoConfig {

    @Value("${spring.data.mongodb.uri}")
    private String mongoUri;

    @Bean
    public MongoClient mongoClient() {
        return MongoClients.create(mongoUri);
    }

    @Bean
    public MongoDatabaseFactory mongoDatabaseFactory(MongoClient mongoClient) {
        // "riskmanager" matches the database name in your connection string
        return new SimpleMongoClientDatabaseFactory(mongoClient, "riskmanager");
    }
}