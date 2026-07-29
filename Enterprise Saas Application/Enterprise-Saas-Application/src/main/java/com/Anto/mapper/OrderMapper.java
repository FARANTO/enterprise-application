package com.Anto.mapper;

import com.Anto.modal.Order;
import com.Anto.payload.dto.OrderDTO;

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
               .cashier(UserMapper.toDTO(order.getCashier()))
               .customer(order.getCustomer())
               .paymentType(order.getPaymentType())
               .createdAt(order.getCreatedAt())
               .items((order.getItems() == null ? Collections.<com.Anto.modal.OrderItem>emptyList() : order.getItems()).stream()
                       .map(OrderItemMapper::toDTO)
                       .collect(Collectors.toList()))
               .build();
    }

}
