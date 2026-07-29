package com.Anto.modal;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private Integer quantity;

    private Double price;              // Final price after discount

    // Discount tracking fields
    private Double originalPrice;      // Price before item-level discount
    private Double discountAmount;     // Discount applied to this item
    private String discountType;       // "PERCENTAGE" | "FLAT" | null
    private Double discountValue;      // Percentage (0-100) or flat amount

    @ManyToOne
    private Product product;

    @ManyToOne
    private Order order;

}