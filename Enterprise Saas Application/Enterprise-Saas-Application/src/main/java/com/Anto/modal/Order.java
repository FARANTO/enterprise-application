package com.Anto.modal;

import com.Anto.domain.PaymentType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name="orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private Double totalAmount;

    // Discount tracking fields
    private Double originalAmount;        // Total before discounts
    private Double discountAmount;        // Total discount applied
    private String discountType;          // "PERCENTAGE" | "FLAT" | "ITEM_LEVEL" | null
    private Double discountPercentage;    // For percentage discounts (0-100)
    private Double discountFlat;          // For flat amount discounts
    private Long authorizedBy;            // Manager ID if discount required authorization

    private LocalDateTime createdAt;

    @ManyToOne
    private Branch branch;

    @ManyToOne
    private User cashier;

    @ManyToOne
    private Customer customer;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderItem> items;

    private PaymentType paymentType;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }



}
