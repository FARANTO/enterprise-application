package com.Anto.mapper;

import com.Anto.modal.Branch;
import com.Anto.modal.Inventory;
import com.Anto.modal.Product;
import com.Anto.payload.dto.InventoryDTO;

public class InventoryMapper {

    public static InventoryDTO toDTO(Inventory inventory) {
        if (inventory == null) {
            return null;
        }

        return InventoryDTO.builder()
                .id(inventory.getId())
                .branchId(inventory.getBranch() != null ? inventory.getBranch().getId() : null)
                .productId(inventory.getProduct() != null ? inventory.getProduct().getId() : null)
                .product(ProductMapper.toDTO(inventory.getProduct()))
                .quantity(inventory.getQuantity())
                .build();
    }


    public static Inventory toEntity(InventoryDTO inventoryDTO, Branch branch, Product product) {
        if (inventoryDTO == null) {
            return null;
        }

        return Inventory.builder()
            .branch(branch)
            .product(product)
            .quantity(inventoryDTO.getQuantity())
            .build();
    }

}
