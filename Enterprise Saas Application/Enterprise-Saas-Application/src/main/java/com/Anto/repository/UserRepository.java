package com.Anto.repository;

import com.Anto.domain.UserRole;
import com.Anto.modal.Store;
import com.Anto.modal.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {

    User findByEmail(String email);
    boolean existsByRole(UserRole role);

    List<User> findByRole(UserRole role);
    List<User> findByStore(Store store);
    List<User> findByBranchId(Long branchId);

}
