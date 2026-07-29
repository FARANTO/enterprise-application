package com.Anto.service;

import com.Anto.modal.User;
import com.Anto.payload.dto.InventoryDTO;

import java.util.List;

public interface InventoryService {

    InventoryDTO createInventory(InventoryDTO inventoryDTO, User user) throws Exception;
    InventoryDTO updateInventory(Long id,InventoryDTO inventoryDTO, User user) throws Exception;
    void deleteInventory(Long id) throws Exception;
    InventoryDTO getInventoryById(Long id) throws Exception;
    InventoryDTO getInventoryByProductIdAndBranchId(Long productId, Long branchId);
    List<InventoryDTO> getAllInventoryByBranchId(Long branchId);

}
