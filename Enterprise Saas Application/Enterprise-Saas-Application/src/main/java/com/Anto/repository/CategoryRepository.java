package com.Anto.repository;

import com.Anto.modal.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {

List<Category> findByStoreId(long storeid);

}
