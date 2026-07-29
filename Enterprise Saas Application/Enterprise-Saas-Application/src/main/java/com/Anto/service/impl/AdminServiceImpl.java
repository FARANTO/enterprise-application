package com.Anto.service.impl;

import com.Anto.domain.UserRole;
import com.Anto.exceptions.UserException;
import com.Anto.mapper.UserMapper;
import com.Anto.modal.Branch;
import com.Anto.modal.Store;
import com.Anto.modal.User;
import com.Anto.payload.dto.UserDto;
import com.Anto.repository.BranchRepository;
import com.Anto.repository.StoreRepository;
import com.Anto.repository.UserRepository;
import com.Anto.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final BranchRepository branchRepository;

    @Override
    public List<UserDto> getAllAdmins() throws Exception {
        return userRepository.findByRole(UserRole.ROLE_ADMIN)
                .stream()
                .map(UserMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteAdmin(Long id) throws Exception {
        User admin = userRepository.findById(id).orElseThrow(
                () -> new Exception("Admin not found with id: " + id)
        );
        if (admin.getRole() != UserRole.ROLE_ADMIN) {
            throw new UserException("User with id " + id + " is not an admin");
        }
        userRepository.delete(admin);
    }

    @Override
    public UserDto assignStoreAndBranch(Long id, Long storeId, Long branchId) throws Exception {
        User admin = userRepository.findById(id).orElseThrow(
                () -> new Exception("Admin not found with id: " + id)
        );

        if (storeId != null) {
            Store store = storeRepository.findById(storeId).orElseThrow(
                    () -> new Exception("Store not found with id: " + storeId)
            );
            admin.setStore(store);
        }

        if (branchId != null) {
            Branch branch = branchRepository.findById(branchId).orElseThrow(
                    () -> new Exception("Branch not found with id: " + branchId)
            );
            admin.setBranch(branch);
        }

        return UserMapper.toDTO(userRepository.save(admin));
    }
}
