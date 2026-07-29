package com.Anto.mapper;

import com.Anto.modal.Category;
import com.Anto.modal.Product;
import com.Anto.modal.Store;
import com.Anto.payload.dto.ProductDTO;

public class ProductMapper {

    public static ProductDTO toDTO(Product product) {
        if (product == null) {
            return null;
        }

        return ProductDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .sku(product.getSku())
                .description(product.getDescription())
                .mrp(product.getMrp())
                .sellingPrice(product.getSellingPrice())
                .costPrice(product.getCostPrice() != null ? product.getCostPrice() : 0.0)
                .category(CategoryMapper.toDTO(product.getCategory()))
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .brand(product.getBrand())
                .storeId(product.getStore() != null ? product.getStore().getId() : null)
                .image(product.getImage())
                .active(product.getActive() != null ? product.getActive() : true)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    public static Product toEntity(ProductDTO productDTO, Store store, Category category) {
        if (productDTO == null) {
            return null;
        }

        return Product.builder()
                .name(productDTO.getName())
                .store(store)
                .category(category)
                .sku(productDTO.getSku())
                .description(productDTO.getDescription())
                .mrp(productDTO.getMrp())
                .sellingPrice(productDTO.getSellingPrice())
                .costPrice(productDTO.getCostPrice() != null ? productDTO.getCostPrice() : 0.0)
                .brand(productDTO.getBrand())
                .image(productDTO.getImage())
                .active(productDTO.getActive() != null ? productDTO.getActive() : true)
                .build();
    }
}
