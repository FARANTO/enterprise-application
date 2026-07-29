package com.Anto.service.impl;

import com.Anto.mapper.ProductMapper;
import com.Anto.modal.Category;
import com.Anto.modal.Inventory;
import com.Anto.modal.OrderItem;
import com.Anto.modal.Product;
import com.Anto.modal.Store;
import com.Anto.modal.User;
import com.Anto.payload.dto.ProductDTO;
import com.Anto.repository.CategoryRepository;
import com.Anto.repository.InventoryRepository;
import com.Anto.repository.OrderItemRepository;
import com.Anto.repository.ProductRepository;
import com.Anto.repository.StoreRepository;
import com.Anto.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryRepository inventoryRepository;
    private final OrderItemRepository orderItemRepository;

    @Override
    public ProductDTO createProduct(ProductDTO productDTO, User user) throws Exception {
        Long storeId = productDTO.getStoreId();

        // 1. Resolve storeId from user if missing
        if (storeId == null && user != null && user.getStore() != null) {
            storeId = user.getStore().getId();
        }

        // 2. Fallback to any existing store if still missing
        if (storeId == null) {
            storeId = storeRepository.findAll().stream()
                    .findFirst()
                    .map(Store::getId)
                    .orElse(null);
        }

        // 3. Auto-create default store if system has no store at all
        Store store = null;
        if (storeId != null) {
            store = storeRepository.findById(storeId).orElse(null);
        }
        if (store == null) {
            Store newStore = new Store();
            newStore.setName("Main Store");
            newStore.setStoreAdmin(user);
            store = storeRepository.save(newStore);
        }

        Category category = null;
        if (productDTO.getCategoryId() != null) {
            category = categoryRepository.findById(productDTO.getCategoryId()).orElse(null);
        }

        // 4. Handle SKU uniqueness
        String sku = productDTO.getSku();
        if (sku == null || sku.trim().isEmpty()) {
            sku = "SKU-" + System.currentTimeMillis();
        } else if (productRepository.existsBySku(sku.trim())) {
            sku = sku.trim() + "-" + System.currentTimeMillis();
        } else {
            sku = sku.trim();
        }
        productDTO.setSku(sku);

        Product product = ProductMapper.toEntity(productDTO, store, category);

        if (product.getActive() == null) {
            product.setActive(true);
        }
        if (product.getMrp() == null) {
            product.setMrp(0.0);
        }
        if (product.getSellingPrice() == null) {
            product.setSellingPrice(0.0);
        }
        if (product.getCostPrice() == null) {
            product.setCostPrice(0.0);
        }

        Product savedProduct = productRepository.save(product);
        return ProductMapper.toDTO(savedProduct);
    }

    @Override
    public ProductDTO updateProduct(Long id, ProductDTO productDTO, User user) throws Exception {

        Product product = productRepository.findById(id).orElseThrow(
                () -> new Exception("Product not found with id: " + id)
        );

        if (productDTO.getName() != null && !productDTO.getName().trim().isEmpty()) {
            product.setName(productDTO.getName().trim());
        }
        if (productDTO.getDescription() != null) {
            product.setDescription(productDTO.getDescription());
        }
        if (productDTO.getSku() != null && !productDTO.getSku().trim().isEmpty()) {
            String newSku = productDTO.getSku().trim();
            if (!newSku.equalsIgnoreCase(product.getSku()) && productRepository.existsBySku(newSku)) {
                newSku = newSku + "-" + System.currentTimeMillis();
            }
            product.setSku(newSku);
        }
        if (productDTO.getImage() != null) {
            product.setImage(productDTO.getImage());
        }
        if (productDTO.getMrp() != null) {
            product.setMrp(productDTO.getMrp());
        }
        if (productDTO.getSellingPrice() != null) {
            product.setSellingPrice(productDTO.getSellingPrice());
        }
        if (productDTO.getBrand() != null) {
            product.setBrand(productDTO.getBrand());
        }
        if (productDTO.getActive() != null) {
            product.setActive(productDTO.getActive());
        }
        product.setUpdatedAt(LocalDateTime.now());

        if (productDTO.getCategoryId() != null) {
            Category category = categoryRepository.findById(productDTO.getCategoryId()).orElse(null);
            if (category != null) {
                product.setCategory(category);
            }
        }

        Product savedProduct = productRepository.save(product);
        return ProductMapper.toDTO(savedProduct);
    }

    @Transactional
    @Override
    public void deleteProduct(Long id, User user) throws Exception {

        Product product = productRepository.findById(id).orElseThrow(
                () -> new Exception("Product not found with id: " + id)
        );

        // 1. Delete associated inventory records
        List<Inventory> productInventories = inventoryRepository.findByProductId(id);
        if (productInventories != null && !productInventories.isEmpty()) {
            inventoryRepository.deleteAll(productInventories);
        }

        // 2. Delete associated order items
        List<OrderItem> orderItems = orderItemRepository.findByProductId(id);
        if (orderItems != null && !orderItems.isEmpty()) {
            orderItemRepository.deleteAll(orderItems);
        }

        // 3. Delete product
        productRepository.delete(product);
    }

    @Override
    public List<ProductDTO> getProductsByStoreId(Long storeId) {
        List<Product> products = productRepository.findByStoreId(storeId);
        return products.stream().map(ProductMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProductDTO> searchByKeyword(Long storeId, String keyword) {
        return productRepository.searchByKeyword(storeId, keyword)
                .stream().map(ProductMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProductDTO> getAllProducts() {
        return productRepository.findAll().stream().map(ProductMapper::toDTO).collect(Collectors.toList());
    }
}
