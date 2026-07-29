package com.Anto.repository;

import com.Anto.modal.Order;
import com.Anto.modal.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

 List<Order> findByCustomerId(Long customerId);
 List<Order> findByBranchId(Long branchId);
 List<Order> findByCashierId(Long cashierId);
 List<Order> findByBranchIdAndCreatedAtBetween(Long branchId, LocalDateTime from, LocalDateTime to);
 List<Order> findByCashierAndCreatedAtBetween(User cashier, LocalDateTime from, LocalDateTime to);
 List<Order> findTop5ByBranchIdOrderByCreatedAtDesc(Long branchId);

 @Query("SELECT o FROM Order o WHERE o.branch.store.id = :storeId")
 List<Order> findByStoreId(@Param("storeId") Long storeId);
}
