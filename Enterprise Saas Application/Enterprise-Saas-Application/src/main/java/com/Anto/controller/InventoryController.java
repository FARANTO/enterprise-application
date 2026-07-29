package com.Anto.controller;


import com.Anto.modal.User;
import com.Anto.payload.dto.InventoryDTO;
import com.Anto.payload.response.ApiResponse;
import com.Anto.repository.InventoryRepository;
import com.Anto.service.InventoryService;
import com.Anto.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/inventories")
public class InventoryController {

    private final InventoryService inventoryService;
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

    @PostMapping()
    public ResponseEntity<InventoryDTO> create(@RequestBody InventoryDTO inventoryDTO,
                                               @RequestHeader(value = "Authorization", required = false) String jwt) throws Exception{
        User user = resolveUser(jwt);
        return ResponseEntity.ok(inventoryService.createInventory(inventoryDTO, user));
    }

   @PutMapping("/{id}")
    public ResponseEntity<InventoryDTO> update(@RequestBody InventoryDTO inventoryDTO, @PathVariable Long id,
                                               @RequestHeader(value = "Authorization", required = false) String jwt) throws Exception{
        User user = resolveUser(jwt);
        return ResponseEntity.ok(inventoryService.updateInventory(id, inventoryDTO, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> delete(@PathVariable Long id) throws Exception{
        inventoryService.deleteInventory(id);


        ApiResponse apiResponse = new ApiResponse();
        apiResponse.setMessage("Inventory Deleted");
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/branch/{branchId}/product/{productId}")
    public ResponseEntity<InventoryDTO> getInventoryByProductAndBranchId(@PathVariable Long branchId,
    @PathVariable Long productId) throws Exception{
        return ResponseEntity.ok(inventoryService.getInventoryByProductIdAndBranchId(productId, branchId));
    }


    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<InventoryDTO>> getInventoryByBranch
            (
                    @PathVariable Long branchId
            )
            throws Exception{
        return ResponseEntity.ok(inventoryService.getAllInventoryByBranchId(branchId));
    }

}
