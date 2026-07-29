package com.Anto.modal;


import com.Anto.domain.PaymentType;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Data;

@Data
@Embeddable
public class PaymentSummary {

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_type")
    private PaymentType type;

    @Column(name = "total_amount")
    private Double totalAmount;

    @Column(name = "transaction_count")
    private int transactionCount;

    private double percentage;



}
