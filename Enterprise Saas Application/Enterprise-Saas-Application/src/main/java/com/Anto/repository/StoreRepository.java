package com.Anto.repository;

import com.Anto.modal.Store;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreRepository extends JpaRepository<Store,Long> {

    Store findByStoreAdminId(Long adminId);

    boolean existsByNameIgnoreCase(String name);
}
