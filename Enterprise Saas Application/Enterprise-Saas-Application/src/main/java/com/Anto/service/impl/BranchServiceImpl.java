package com.Anto.service.impl;

import com.Anto.exceptions.UserException;
import com.Anto.mapper.BranchMapper;
import com.Anto.modal.Branch;
import com.Anto.modal.Store;
import com.Anto.modal.User;
import com.Anto.payload.dto.BranchDTO;
import com.Anto.repository.BranchRepository;
import com.Anto.repository.StoreRepository;
import com.Anto.service.BranchService;
import com.Anto.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.Anto.modal.Inventory;
import com.Anto.repository.InventoryRepository;
import com.Anto.repository.UserRepository;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BranchServiceImpl implements BranchService {

    private final BranchRepository branchRepository;
    private final StoreRepository storeRepository;
    private final UserService userService;
    private final UserRepository userRepository;
    private final InventoryRepository inventoryRepository;
    private final com.Anto.repository.ShiftReportRepository shiftReportRepository;
    private final com.Anto.repository.RefundRepository refundRepository;
    private final com.Anto.repository.OrderRepository orderRepository;

    @Override
    public BranchDTO createBranch(BranchDTO branchDTO) throws UserException {
        User currentUser = userService.getCurrentUser();
        // only system admin can create branches
        if (currentUser == null || !currentUser.getRole().equals(com.Anto.domain.UserRole.ROLE_ADMIN)) {
            throw new UserException("Only system admin can create branches");
        }

        if (branchDTO.getStoreId() == null) {
            throw new UserException("storeId is required to create a branch");
        }

        Store store = storeRepository.findById(branchDTO.getStoreId()).orElseThrow(
                () -> new UserException("Store not found")
        );

        if (branchDTO.getId() != null && branchRepository.existsById(branchDTO.getId())) {
            throw new UserException("Branch ID already exists");
        }

        Branch branch= BranchMapper.toEntity(branchDTO, store);
        if (branchDTO.getId() != null) {
            branch.setId(branchDTO.getId());
        }
        Branch savedBranch = branchRepository.save(branch);
        return BranchMapper.toDTO(savedBranch);
    }

    @Override
    public BranchDTO updateBranch(Long id, BranchDTO branchDTO) throws Exception {

        Branch existing=branchRepository.findById(id).orElseThrow(
                () -> new Exception("branch do not exist ...")
        );

        existing.setName(branchDTO.getName());
        existing.setWorkingDays(branchDTO.getWorkingDays());
        existing.setEmail(branchDTO.getEmail());
        existing.setPhone(branchDTO.getPhone());
        existing.setAddress(branchDTO.getAddress());
        existing.setOpenTime(branchDTO.getOpenTime());
        existing.setCloseTime(branchDTO.getCloseTime());
        existing.setUpdatedAt(LocalDateTime.now());

        Branch updatedBranch=branchRepository.save(existing);
        return BranchMapper.toDTO(updatedBranch);
    }

    @Transactional
    @Override
    public void deleteBranch(Long id) throws Exception {

        Branch existing = branchRepository.findById(id).orElseThrow(
                () -> new Exception("Branch does not exist...")
        );

        if (existing.getManager() != null) {
            User mgr = existing.getManager();
            mgr.setBranch(null);
            userRepository.saveAndFlush(mgr);
            existing.setManager(null);
            branchRepository.saveAndFlush(existing);
        }

        // Unlink users associated with this branch
        List<User> users = userRepository.findByBranchId(id);
        for (User u : users) {
            u.setBranch(null);
            userRepository.save(u);
        }
        userRepository.flush();

        // Unlink shift reports
        List<com.Anto.modal.ShiftReport> shiftReports = shiftReportRepository.findByBranchId(id);
        for (com.Anto.modal.ShiftReport sr : shiftReports) {
            sr.setBranch(null);
            shiftReportRepository.save(sr);
        }

        // Unlink refunds
        List<com.Anto.modal.Refund> refunds = refundRepository.findByBranchId(id);
        for (com.Anto.modal.Refund r : refunds) {
            r.setBranch(null);
            refundRepository.save(r);
        }

        // Unlink orders
        List<com.Anto.modal.Order> orders = orderRepository.findByBranchId(id);
        for (com.Anto.modal.Order o : orders) {
            o.setBranch(null);
            orderRepository.save(o);
        }

        // Delete inventory records associated with this branch
        List<Inventory> inventories = inventoryRepository.findByBranchId(id);
        if (inventories != null && !inventories.isEmpty()) {
            inventoryRepository.deleteAll(inventories);
        }

        branchRepository.delete(existing);
    }

    @Override
    public List<BranchDTO> getAllBranches() throws Exception {
        List<Branch> branches = branchRepository.findAll();
        return branches.stream().map(BranchMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<BranchDTO> getAllBranchesByStoreId(Long storeId) {
        List<Branch> branches= branchRepository.findByStoreId(storeId);
        return branches.stream().map(BranchMapper ::toDTO )
                .collect(Collectors.toList());

    }

    @Override
    public BranchDTO getBranchById(Long id) throws Exception {
        Branch existing=branchRepository.findById(id).orElseThrow(
                () -> new Exception("bracnh not exist ...")
        );
        return BranchMapper.toDTO(existing);
    }
}
