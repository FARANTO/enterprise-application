package com.Anto.service.impl;

import com.Anto.mapper.RefundMapper;
import com.Anto.modal.Branch;
import com.Anto.modal.Order;
import com.Anto.modal.Refund;
import com.Anto.modal.User;
import com.Anto.payload.dto.RefundDTO;
import com.Anto.repository.InventoryRepository;
import com.Anto.repository.OrderRepository;
import com.Anto.repository.RefundRepository;
import com.Anto.service.RefundService;
import com.Anto.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RefundServiceImpl implements RefundService {

    private final UserService userService;
    private final OrderRepository orderRepository;
    private final RefundRepository refundRepository;
    private final InventoryRepository inventoryRepository;

    @Override
    public RefundDTO createRefund(RefundDTO refund) throws Exception {

        User cashier=userService.getCurrentUser();

        Order order = orderRepository.findById(refund.getOrderId()).orElseThrow(
                () -> new Exception("Order Not Found")
        );

        Branch branch=order.getBranch();

        Refund createdRefund=Refund.builder()
                .order(order)
                .cashier(cashier)
                .branch(branch)
                .reason(refund.getReason())
                .amount(refund.getAmount())
                .paymentType(refund.getPaymentType())
                .createdAt(refund.getCreatedAt())
                .build();
        Refund savedRefund=refundRepository.save(createdRefund);

        if (refund.getRefundItems() != null && !refund.getRefundItems().isEmpty()) {
            for (com.Anto.payload.dto.RefundItemDTO refundItem : refund.getRefundItems()) {
                com.Anto.modal.OrderItem orderItem = order.getItems().stream()
                        .filter(item -> item.getProduct() != null && item.getProduct().getId().equals(refundItem.getProductId()))
                        .findFirst().orElse(null);
                if (orderItem != null) {
                    com.Anto.modal.Inventory inventory = inventoryRepository.findByProductIdAndBranchId(refundItem.getProductId(), branch.getId());
                    if (inventory == null) {
                        inventory = com.Anto.modal.Inventory.builder()
                                .branch(branch)
                                .product(orderItem.getProduct())
                                .quantity(refundItem.getQuantity())
                                .build();
                    } else {
                        int currentQuantity = inventory.getQuantity() != null ? inventory.getQuantity() : 0;
                        inventory.setQuantity(currentQuantity + (refundItem.getQuantity() != null ? refundItem.getQuantity() : 0));
                    }
                    inventoryRepository.save(inventory);
                }
            }
        } else if (refund.getAmount() != null && order.getTotalAmount() != null && refund.getAmount().equals(order.getTotalAmount())) {
            for (com.Anto.modal.OrderItem orderItem : order.getItems()) {
                com.Anto.modal.Inventory inventory = inventoryRepository.findByProductIdAndBranchId(orderItem.getProduct().getId(), branch.getId());
                if (inventory == null) {
                    inventory = com.Anto.modal.Inventory.builder()
                            .branch(branch)
                            .product(orderItem.getProduct())
                            .quantity(orderItem.getQuantity())
                            .build();
                } else {
                    int currentQuantity = inventory.getQuantity() != null ? inventory.getQuantity() : 0;
                    inventory.setQuantity(currentQuantity + (orderItem.getQuantity() != null ? orderItem.getQuantity() : 0));
                }
                inventoryRepository.save(inventory);
            }
        }

        return RefundMapper.toDTO(savedRefund);
    }

    @Override
    public List<RefundDTO> getAllRefunds() throws Exception {
        return refundRepository.findAll().stream().map(RefundMapper::toDTO).collect(Collectors.toList());
    }

    @Override
    public  List<RefundDTO> getRefundByCashier(Long cashierId) throws Exception {
        return refundRepository.findByCashierId(cashierId).stream().map(RefundMapper::toDTO).collect(Collectors.toList());
    }

    @Override
    public List<RefundDTO> getRefundByShiftReportId(Long shiftReportId) throws Exception {
        return refundRepository.findByShiftReportId(shiftReportId).stream().map(RefundMapper::toDTO).collect(Collectors.toList());
    }

    @Override
    public List<RefundDTO> getRefundByCashierAndDateRange(Long cashierId,
                                                          LocalDateTime startDate,
                                                          LocalDateTime endDate) throws Exception {
        return refundRepository.findByCashierIdAndCreatedAtBetween(
                cashierId, startDate, endDate
        ).stream().map(RefundMapper::toDTO).collect(Collectors.toList());
    }

    @Override
    public List<RefundDTO> getRefundByBranch(Long branchId) throws Exception {
        return refundRepository.findByBranchId(branchId).stream().map(RefundMapper::toDTO).collect(Collectors.toList());
    }

    @Override
    public RefundDTO getRefundById(Long refundId) throws Exception {
        return refundRepository.findById(refundId).map(RefundMapper::toDTO).orElseThrow(
                () -> new Exception("Refund Not Found")
        );
    }

    @Override
    public void deleteRefund(Long refundId) throws Exception {
        this.getRefundById(refundId);
        refundRepository.deleteById(refundId);
    }
}
