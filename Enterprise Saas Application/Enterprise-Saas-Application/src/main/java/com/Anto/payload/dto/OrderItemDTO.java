package com.Anto.payload.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class OrderItemDTO {

    private Long id;

    private Integer quantity;

    private Double price;

    private ProductDTO product;

    private Long productId;

    private Long orderId;

    private Double originalPrice;
    private Double discountAmount;
    private String discountMode;
    private Double discountValue;

}
