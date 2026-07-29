package com.Anto.controller;

import com.Anto.modal.User;
import com.Anto.payload.dto.ProductDTO;
import com.Anto.payload.response.ApiResponse;
import com.Anto.service.ProductService;
import com.Anto.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final UserService userService;

    private User resolveUser(String jwt) {
        try {
            if (jwt != null && !jwt.isBlank()) {
                return userService.getUserFromJwttoken(jwt);
            }
            return userService.getCurrentUser();
        } catch (Exception e) {
            return null;
        }
    }

    @PostMapping
    public ResponseEntity<ProductDTO> create(@RequestBody ProductDTO productDTO,
                                             @RequestHeader(value = "Authorization", required = false) String jwt) throws Exception {
        User user = resolveUser(jwt);
        return ResponseEntity.ok(productService.createProduct(productDTO, user));
    }

    @GetMapping
    public ResponseEntity<List<ProductDTO>> getAll(
            @RequestHeader(value = "Authorization", required = false) String jwt) throws Exception {
        User user = resolveUser(jwt);
        if (user != null && user.getStore() != null) {
            return ResponseEntity.ok(productService.getProductsByStoreId(user.getStore().getId()));
        }
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/store/{storeId}")
    public ResponseEntity<List<ProductDTO>> getByStoreId(
            @PathVariable Long storeId,
            @RequestHeader(value = "Authorization", required = false) String jwt) throws Exception {
        return ResponseEntity.ok(productService.getProductsByStoreId(storeId));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ProductDTO> update(
            @PathVariable Long id,
            @RequestBody ProductDTO productDTO,
            @RequestHeader(value = "Authorization", required = false) String jwt) throws Exception {
        User user = resolveUser(jwt);
        return ResponseEntity.ok(productService.updateProduct(id, productDTO, user));
    }

    @GetMapping("/store/{storeId}/search")
    public ResponseEntity<List<ProductDTO>> searchByKeyword(
            @PathVariable Long storeId,
            @RequestParam String keyword,
            @RequestHeader(value = "Authorization", required = false) String jwt) throws Exception {
        return ResponseEntity.ok(productService.searchByKeyword(storeId, keyword));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> delete(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String jwt) throws Exception {
        User user = resolveUser(jwt);
        productService.deleteProduct(id, user);

        ApiResponse apiResponse = new ApiResponse();
        apiResponse.setMessage("Product deleted Successfully");
        return ResponseEntity.ok(apiResponse);
    }
}
