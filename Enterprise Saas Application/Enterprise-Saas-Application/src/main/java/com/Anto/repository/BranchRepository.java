package com.Anto.repository;

import com.Anto.modal.Branch;
import com.Anto.payload.dto.BranchDTO;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BranchRepository extends JpaRepository<Branch, Long> {

    List<Branch> findByStoreId(Long storeId);



}
