package com.riskmanager.return_risk_backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Value("${app.admin.username}")
    private String adminUsername;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                .authorizeHttpRequests(auth -> auth

                        // Only ADMIN can change the threshold
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/orders/threshold"
                        )
                        .hasRole("ADMIN")

                        // Dashboard can read the current threshold
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/orders/threshold"
                        )
                        .permitAll()

                        // Normal scoring and audit endpoints
                        .requestMatchers(
                                "/api/orders/score",
                                "/api/orders/audit-log"
                        )
                        .permitAll()

                        .anyRequest()
                        .permitAll()
                )

                .httpBasic(Customizer.withDefaults());

        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService(
            PasswordEncoder passwordEncoder
    ) {

        UserDetails admin =
                User.builder()
                        .username(adminUsername)
                        .password(
                                passwordEncoder.encode(
                                        adminPassword
                                )
                        )
                        .roles("ADMIN")
                        .build();

        return new InMemoryUserDetailsManager(admin);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}