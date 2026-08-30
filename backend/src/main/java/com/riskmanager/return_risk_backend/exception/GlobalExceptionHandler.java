package com.riskmanager.return_risk_backend.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger =
            LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationException(
            MethodArgumentNotValidException exception
    ) {

        String message = "Validation failed";

        if (exception.getBindingResult().getFieldError() != null) {
            message = exception
                    .getBindingResult()
                    .getFieldError()
                    .getDefaultMessage();
        }

        logger.warn(
                "Validation failed: {}",
                message
        );

        Map<String, String> response =
                new LinkedHashMap<>();

        response.put(
                "error",
                "Validation failed"
        );

        response.put(
                "message",
                message
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(
            IllegalArgumentException exception
    ) {

        logger.warn(
                "Invalid request: {}",
                exception.getMessage()
        );

        Map<String, String> response =
                new LinkedHashMap<>();

        response.put(
                "error",
                "Invalid request"
        );

        response.put(
                "message",
                exception.getMessage()
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneralException(
            Exception exception
    ) {

        logger.error(
                "Unexpected server error",
                exception
        );

        Map<String, String> response =
                new LinkedHashMap<>();

        response.put(
                "error",
                "Internal server error"
        );

        response.put(
                "message",
                "An unexpected error occurred"
        );

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }
}