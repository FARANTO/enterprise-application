package com.Anto.mapper;

import com.Anto.modal.Order;
import com.Anto.modal.Product;
import com.Anto.modal.Refund;
import com.Anto.modal.ShiftReport;
import com.Anto.payload.dto.OrderDTO;
import com.Anto.payload.dto.ProductDTO;
import com.Anto.payload.dto.RefundDTO;
import com.Anto.payload.dto.ShiftReportDTO;

import java.util.List;
import java.util.stream.Collectors;

public class ShiftReportMapper {

    public static ShiftReportDTO toDTO(ShiftReport entity) {
        if (entity == null) {
            return null;
        }

        return ShiftReportDTO.builder()
                .id(entity.getId())
                .shiftEnd(entity.getShiftEnd())
                .shiftStart(entity.getShiftStart())
                .totalSales(entity.getTotalSales())
                .netSales(entity.getNetSales())
                .totalOrders(entity.getTotalOrders())
                .totalRefunds(entity.getTotalRefunds())
                .cashier(UserMapper.toDTO(entity.getCashier()))
                .cashierId(entity.getCashier() != null ? entity.getCashier().getId() : null)
                .branchId(entity.getBranch() != null ? entity.getBranch().getId() : null)
                .recentOrders(mapOrders(entity.getRecentOrders()))
                .topSellingProducts(mapProducts(entity.getTopSellingProducts()))
                .refunds(mapRefunds(entity.getRefunds()))
                .paymentSummaries(entity.getPaymentSummaries())
                .build();


    }

    private static List<RefundDTO> mapRefunds(List<Refund> refunds) {
        if (refunds == null || refunds.isEmpty()) {return null;}

        return refunds.stream().map(RefundMapper::toDTO).collect(Collectors.toList());
    }

    private static List<ProductDTO> mapProducts(java.util.Collection<Product> topSellingProducts) {
        if (topSellingProducts == null || topSellingProducts.isEmpty()) {return null;}
        return topSellingProducts.stream().map(ProductMapper::toDTO).collect(Collectors.toList());
    }

    private static List<OrderDTO> mapOrders(List<Order> recentOrders) {
        if (recentOrders == null || recentOrders.isEmpty()) {return null;}

        return recentOrders.stream().map(OrderMapper::toDTO).collect(Collectors.toList());
    }


}
