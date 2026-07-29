package com.Anto.service.impl;

import com.Anto.domain.UserRole;
import com.Anto.mapper.InventoryMapper;
import com.Anto.modal.Branch;
import com.Anto.modal.Inventory;
import com.Anto.modal.Product;
import com.Anto.modal.User;
import com.Anto.payload.dto.InventoryDTO;
import com.Anto.repository.BranchRepository;
import com.Anto.repository.InventoryRepository;
import com.Anto.repository.ProductRepository;
import com.Anto.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final ProductRepository productRepository;
    private final BranchRepository branchRepository;
    private final InventoryRepository inventoryRepository;

    private boolean canManageInventory(User user, Branch branch) {
        if (user == null || branch == null) {
            return false;
        }
        if (user.getRole() == UserRole.ROLE_ADMIN) {
            return true;
        }
        if (user.getRole() == UserRole.ROLE_BRANCH_MANAGER) {
            return user.getBranch() != null && branch.getId().equals(user.getBranch().getId());
        }
        if (user.getRole() == UserRole.ROLE_STORE_MANAGER || user.getRole() == UserRole.ROLE_STORE_ADMIN) {
            return user.getStore() != null && branch.getStore() != null && branch.getStore().getId().equals(user.getStore().getId());
        }
        return false;
    }

    @Override
    public InventoryDTO createInventory(InventoryDTO inventoryDTO, User user) throws Exception {

        Branch branch=branchRepository.findById(inventoryDTO.getBranchId()).orElseThrow(
                () -> new Exception("Branch not found")
        );

        if (!canManageInventory(user, branch)) {
            throw new Exception("Only managers or admins can create inventory records for this branch.");
        }

        Product product=productRepository.findById(inventoryDTO.getProductId()).orElseThrow(
                () -> new Exception("Product does not exist.")
        );

        final Integer quantity = inventoryDTO.getQuantity() != null ? inventoryDTO.getQuantity() : 0;
        if (quantity < 0) {
            throw new Exception("Quantity must be zero or greater.");
        }

        Inventory inventory= InventoryMapper.toEntity(inventoryDTO,branch,product);
        Inventory savedInventory=inventoryRepository.save(inventory);
        return InventoryMapper.toDTO(savedInventory);
    }

    @Override
    public InventoryDTO updateInventory(Long id, InventoryDTO inventoryDTO, User user) throws Exception {
        Inventory inventory=inventoryRepository.findById(id).orElseThrow(
                ()-> new Exception("Inventory not found...")
        );

        Branch branch = inventory.getBranch();
        if (!canManageInventory(user, branch)) {
            throw new Exception("Only managers or admins can update inventory for this branch.");
        }

        final Integer quantity = inventoryDTO.getQuantity() != null ? inventoryDTO.getQuantity() : inventory.getQuantity();
        if (quantity < 0) {
            throw new Exception("Quantity must be zero or greater.");
        }
        inventory.setQuantity(quantity);
        Inventory updatedInventory=inventoryRepository.save(inventory);

        return InventoryMapper.toDTO(updatedInventory);
    }

    @Override
    public void deleteInventory(Long id) throws Exception {

        Inventory inventory=inventoryRepository.findById(id).orElseThrow(
                ()-> new Exception("Inventory not found...")
        );
        inventoryRepository.delete(inventory);

    }

    @Override
    public InventoryDTO getInventoryById(Long id) throws Exception {

        Inventory inventory=inventoryRepository.findById(id).orElseThrow(
                ()-> new Exception("Inventory not found...")
        );

        return InventoryMapper.toDTO(inventory);
    }

    @Override
    public InventoryDTO getInventoryByProductIdAndBranchId(Long productId, Long branchId) {

        Inventory inventory=inventoryRepository.findByProductIdAndBranchId(productId, branchId);

        return InventoryMapper.toDTO(inventory);
    }

    @Override
    public List<InventoryDTO> getAllInventoryByBranchId(Long branchId) {
        List<Inventory> inventories=inventoryRepository.findByBranchId(branchId);
        return inventories.stream().map(
                InventoryMapper::toDTO
        ).collect(Collectors.toList());
    }



}
