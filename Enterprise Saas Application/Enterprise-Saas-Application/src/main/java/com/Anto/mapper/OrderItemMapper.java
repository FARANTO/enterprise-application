package com.Anto.mapper;

import com.Anto.modal.OrderItem;
import com.Anto.payload.dto.OrderItemDTO;

public class OrderItemMapper {

    public static OrderItemDTO toDTO(OrderItem item) {

        if (item == null) {
            return null;
        }

        return OrderItemDTO.builder()
                    .id(item.getId())
                    .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                    .quantity(item.getQuantity())
                    .price(item.getPrice())
                    .originalPrice(item.getOriginalPrice())
                    .discountAmount(item.getDiscountAmount())
                    .discountMode(item.getDiscountType())
                    .discountValue(item.getDiscountValue())
                    .product(ProductMapper.toDTO(item.getProduct()))
                    .build();

    }


}
