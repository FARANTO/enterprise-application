package com.Anto.payload.dto;

import com.Anto.domain.PaymentType;
import com.Anto.modal.Branch;
import com.Anto.modal.Order;
import com.Anto.modal.ShiftReport;
import com.Anto.payload.dto.RefundItemDTO;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.ManyToOne;
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
public class RefundDTO {

    private Long id;

    @ManyToOne
    private OrderDTO order;
    private Long orderId;


    private String reason;

    private Double amount;

    private ShiftReport shiftReport;
    private Long shiftReportId;
    private List<RefundItemDTO> refundItems;

    private UserDto cashier;
    private String cashierName;

    private BranchDTO branch;
    private Long branchId;

    private PaymentType paymentType;
    private LocalDateTime createdAt;

}
