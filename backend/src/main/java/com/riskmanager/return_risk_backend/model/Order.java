package com.riskmanager.return_risk_backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class Order {

    @JsonProperty("order_value")
    @DecimalMin(
            value = "0.01",
            message = "Order value must be greater than 0"
    )
    private double orderValue;

    @NotBlank(message = "Category is required")
    private String category;

    @JsonProperty("discount_pct")
    @DecimalMin(
            value = "0.0",
            message = "Discount must be at least 0"
    )
    @DecimalMax(
            value = "100.0",
            message = "Discount must not exceed 100"
    )
    private double discountPct;

    @JsonProperty("payment_method")
    @NotBlank(message = "Payment method is required")
    private String paymentMethod;

    @JsonProperty("past_orders")
    @Min(
            value = 0,
            message = "Past orders must be 0 or more"
    )
    private int pastOrders;

    @JsonProperty("past_returns")
    @Min(
            value = 0,
            message = "Past returns must be 0 or more"
    )
    private int pastReturns;

    @JsonProperty("account_age_days")
    @Min(
            value = 0,
            message = "Account age must be 0 days or more"
    )
    private int accountAgeDays;

    @JsonProperty("city_tier")
    @NotBlank(message = "City tier is required")
    private String cityTier;

    @JsonProperty("delivery_days")
    @Min(
            value = 0,
            message = "Delivery days must be 0 or more"
    )
    private int deliveryDays;

    @JsonProperty("product_rating")
    @DecimalMin(
            value = "0.0",
            message = "Product rating must be at least 0"
    )
    @DecimalMax(
            value = "5.0",
            message = "Product rating must not exceed 5"
    )
    private double productRating;

    public double getOrderValue() {
        return orderValue;
    }

    public void setOrderValue(double orderValue) {
        this.orderValue = orderValue;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public double getDiscountPct() {
        return discountPct;
    }

    public void setDiscountPct(double discountPct) {
        this.discountPct = discountPct;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public int getPastOrders() {
        return pastOrders;
    }

    public void setPastOrders(int pastOrders) {
        this.pastOrders = pastOrders;
    }

    public int getPastReturns() {
        return pastReturns;
    }

    public void setPastReturns(int pastReturns) {
        this.pastReturns = pastReturns;
    }

    public int getAccountAgeDays() {
        return accountAgeDays;
    }

    public void setAccountAgeDays(int accountAgeDays) {
        this.accountAgeDays = accountAgeDays;
    }

    public String getCityTier() {
        return cityTier;
    }

    public void setCityTier(String cityTier) {
        this.cityTier = cityTier;
    }

    public int getDeliveryDays() {
        return deliveryDays;
    }

    public void setDeliveryDays(int deliveryDays) {
        this.deliveryDays = deliveryDays;
    }

    public double getProductRating() {
        return productRating;
    }

    public void setProductRating(double productRating) {
        this.productRating = productRating;
    }
}