package com.Anto.service.impl;

import com.Anto.mapper.InventoryMapper;
import com.Anto.modal.Branch;
import com.Anto.modal.Inventory;
import com.Anto.modal.Product;
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

    @Override
    public InventoryDTO createInventory(InventoryDTO inventoryDTO) throws Exception {

        Branch branch=branchRepository.findById(inventoryDTO.getBranchId()).orElseThrow(
                () -> new Exception("Not available in this branch")
        );

        Product product=productRepository.findById(inventoryDTO.getProductId()).orElseThrow(
                () -> new Exception("Product do not exist ...")
        );

        Inventory inventory= InventoryMapper.toEntity(inventoryDTO,branch,product);
        Inventory savedInventory=inventoryRepository.save(inventory);
        return InventoryMapper.toDTO(savedInventory);
    }

    @Override
    public InventoryDTO updateInventory(Long id, InventoryDTO inventoryDTO) throws Exception {
        Inventory inventory=inventoryRepository.findById(id).orElseThrow(
                ()-> new Exception("Inventory not found...")
        );

        inventory.setQuantity(inventoryDTO.getQuantity());
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
