package com.Anto.mapper;

import com.Anto.modal.Order;
import com.Anto.payload.dto.OrderDTO;
import com.Anto.payload.dto.StoreDTO;

import java.util.Collections;
import java.util.stream.Collectors;

public class OrderMapper {

    public static OrderDTO toDTO(Order order) {
       if (order == null) {
           return null;
       }

       return OrderDTO.builder()
               .id(order.getId())
               .totalAmount(order.getTotalAmount())
               .branchId(order.getBranch() != null ? order.getBranch().getId() : null)
               .storeId(order.getBranch() != null && order.getBranch().getStore() != null ? order.getBranch().getStore().getId() : null)
               .store(StoreMapper.toDTO(order.getBranch() != null ? order.getBranch().getStore() : null))
               .cashier(UserMapper.toDTO(order.getCashier()))
               .customer(order.getCustomer())
               .paymentType(order.getPaymentType())
               .createdAt(order.getCreatedAt())
               .originalAmount(order.getOriginalAmount())
               .discountAmount(order.getDiscountAmount())
               .discountType(order.getDiscountType())
               .discountPercentage(order.getDiscountPercentage())
               .discountFlat(order.getDiscountFlat())
               .authorizedBy(order.getAuthorizedBy())
               .items((order.getItems() == null ? Collections.<com.Anto.modal.OrderItem>emptyList() : order.getItems()).stream()
                       .map(OrderItemMapper::toDTO)
                       .collect(Collectors.toList()))
               .build();
    }

}
