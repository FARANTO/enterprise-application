package com.Anto.payload.dto;

import com.Anto.domain.PaymentType;
import com.Anto.modal.Customer;
import com.Anto.payload.dto.StoreDTO;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class OrderDTO {

    private Long id;

    private Double totalAmount;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    private Long branchId;
    private Long customerId;
    private Long storeId;

    private StoreDTO store;
    private BranchDTO branch;

    private UserDto cashier;

    private Customer customer;

    private PaymentType paymentType;

    private Double originalAmount;
    private Double discountAmount;
    private String discountType;
    private Double discountPercentage;
    private Double discountFlat;
    private Long authorizedBy;

    private List<OrderItemDTO> items;

}
