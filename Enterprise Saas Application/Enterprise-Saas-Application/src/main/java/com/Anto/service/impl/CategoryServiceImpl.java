package com.Anto.service.impl;

import com.Anto.domain.UserRole;
import com.Anto.exceptions.UserException;
import com.Anto.mapper.CategoryMapper;
import com.Anto.modal.Category;
import com.Anto.modal.Store;
import com.Anto.modal.User;
import com.Anto.payload.dto.CategoryDTO;
import com.Anto.repository.CategoryRepository;
import com.Anto.repository.StoreRepository;
import com.Anto.service.CategoryService;
import com.Anto.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {
    private final CategoryRepository categoryRepository;
    private final UserService userService;
    private final StoreRepository storeRepository;

    @Override
    public CategoryDTO createCategory(CategoryDTO dto) throws Exception {
        User user =userService.getCurrentUser();

        Store store;
        if(dto.getStoreId() == null){
            store = user.getStore();
            if(store == null){
                throw new Exception("Store not found");
            }
        } else {
            store = storeRepository.findById(dto.getStoreId()).orElseThrow(
                    () -> new Exception("Store not found")
            );
        }

        Category category=Category.builder()
                .store(store)
                .name(dto.getName())
                .build();

        checkAuthority(user, category.getStore());



        return CategoryMapper.toDTO(categoryRepository.save(category));
    }

    @Override
    public List<CategoryDTO> getCategoriesByStore(Long storeId) {
        List<Category> categories=categoryRepository.findByStoreId(storeId);
        return categories.stream()
                .map(
                        CategoryMapper::toDTO
                ).collect(Collectors.toList());
    }

    @Override
    public CategoryDTO updateCategory(Long id, CategoryDTO dto) throws Exception {
        Category category=categoryRepository.findById(id).orElseThrow(
                () -> new Exception("category does not exist")
        );
        User user = userService.getCurrentUser();
        category.setName(dto.getName());
        checkAuthority(user, category.getStore());
        return CategoryMapper.toDTO(categoryRepository.save(category));
    }

    @Override
    public void deleteCategory(Long id) throws Exception {

        Category category=categoryRepository.findById(id).orElseThrow(
                () -> new Exception("category does not exist")
        );
        User user = userService.getCurrentUser();

        checkAuthority(user, category.getStore());

        categoryRepository.delete(category);

    }

    private void checkAuthority(User user, Store store) throws Exception {
        // Permission policy:
        // - System admins (ROLE_ADMIN) can manage anywhere
        // - Store admins (ROLE_STORE_ADMIN) who are the store admin for this store can manage
        // - Store managers (ROLE_STORE_MANAGER) can manage
        boolean isSystemAdmin = user.getRole().equals(UserRole.ROLE_ADMIN);
        boolean isStoreAdmin = user.getRole().equals(UserRole.ROLE_STORE_ADMIN);
        boolean isStoreManager = user.getRole().equals(UserRole.ROLE_STORE_MANAGER);
        boolean isSameStoreAdmin = store != null && store.getStoreAdmin() != null && user.equals(store.getStoreAdmin());

        if (!(isSystemAdmin || (isStoreAdmin && isSameStoreAdmin) || isStoreManager)) {
            throw new Exception("You do not have permission to manage this");
        }
    }

}
