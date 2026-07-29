package com.Anto.service.impl;

import com.Anto.domain.StoreStatus;
import com.Anto.exceptions.UserException;
import com.Anto.mapper.StoreMapper;
import com.Anto.modal.Store;
import com.Anto.modal.StoreContact;
import com.Anto.modal.User;
import com.Anto.payload.dto.StoreDTO;
import com.Anto.repository.StoreRepository;
import com.Anto.service.StoreService;
import com.Anto.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

import com.Anto.modal.Branch;
import com.Anto.modal.Category;
import com.Anto.modal.Inventory;
import com.Anto.modal.Product;
import com.Anto.repository.BranchRepository;
import com.Anto.repository.CategoryRepository;
import com.Anto.repository.InventoryRepository;
import com.Anto.repository.ProductRepository;
import com.Anto.repository.UserRepository;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StoreServiceImpl implements StoreService {

    private final StoreRepository storeRepository;
    private final UserService userService;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryRepository inventoryRepository;

    @Override
    public StoreDTO createStore(StoreDTO storeDTO, User user) throws UserException {

        // only system admin can create stores
        if (user == null || !user.getRole().equals(com.Anto.domain.UserRole.ROLE_ADMIN)) {
            throw new UserException("Only system admin can create stores");
        }

        if (storeDTO.getId() != null && storeRepository.existsById(storeDTO.getId())) {
            throw new UserException("Store ID already exists");
        }

        Store store = StoreMapper.toEntity(storeDTO, user);
        if (storeDTO.getId() != null) {
            store.setId(storeDTO.getId());
        }
        return StoreMapper.toDto(storeRepository.save(store));
    }

    @Override
    public StoreDTO getStoreById(Long id) throws Exception {

        Store store = storeRepository.findById(id).orElseThrow(
                ()->new Exception("Store not Found....")
        );

        return StoreMapper.toDto(store);

    }

    @Override
    public List<StoreDTO> getAllStores() {
        List<Store> dtos = storeRepository.findAll();
        return dtos.stream().map(StoreMapper::toDTO).collect(Collectors.toList());

    }

    @Override
    public Store getStoreByName() {
        return null;
    }

    @Override
    public Store getStoreByAdmin() throws UserException {

        User admin=userService.getCurrentUser();
        return storeRepository.findByStoreAdminId(admin.getId());
    }

    @Override
    public StoreDTO updateStore(Long id, StoreDTO storeDTO) throws Exception {
        User currentUser=userService.getCurrentUser();

        Store existing=storeRepository.findByStoreAdminId(currentUser.getId());

        if(existing==null){
            throw new Exception("Store not Found....");
        }

        if (storeDTO.getName() != null) {
            existing.setName(storeDTO.getName());
        }
        existing.setBrand(storeDTO.getBrand());
        existing.setDescription(storeDTO.getDescription());

        if (storeDTO.getStoreType()!=null) {
            existing.setStoreType(storeDTO.getStoreType());
        }

        if (storeDTO.getContact()!=null) {
            StoreContact contact=StoreContact.builder().address(storeDTO.getContact().getAddress())
                    .phone(storeDTO.getContact().getPhone()).email(storeDTO.getContact().getEmail()).build();
            existing.setContact(contact);
        }

        Store updated=storeRepository.save(existing);
        return StoreMapper.toDto(updated);
    }

    @Transactional
    @Override
    public void deleteStore(Long id) throws UserException {

        Store store = storeRepository.findById(id).orElseThrow(
                () -> new UserException("Store not found with id: " + id)
        );

        // 1. Unlink store admin reference on Store entity
        if (store.getStoreAdmin() != null) {
            User admin = store.getStoreAdmin();
            store.setStoreAdmin(null);
            storeRepository.saveAndFlush(store);

            admin.setBranch(null);
            admin.setStore(null);
            userRepository.saveAndFlush(admin);
        }

        List<Branch> branches = branchRepository.findByStoreId(id);

        // 2. Clear manager reference and branch/store on users in branches belonging to this store
        for (Branch branch : branches) {
            if (branch.getManager() != null) {
                User mgr = branch.getManager();
                mgr.setBranch(null);
                mgr.setStore(null);
                userRepository.save(mgr);
                branch.setManager(null);
                branchRepository.save(branch);
            }
            List<User> branchUsers = userRepository.findByBranchId(branch.getId());
            for (User u : branchUsers) {
                u.setBranch(null);
                u.setStore(null);
                userRepository.save(u);
            }
            List<Inventory> branchInventories = inventoryRepository.findByBranchId(branch.getId());
            if (branchInventories != null && !branchInventories.isEmpty()) {
                inventoryRepository.deleteAll(branchInventories);
            }
        }
        userRepository.flush();

        // 3. Unlink all users belonging to this store
        List<User> storeUsers = userRepository.findByStore(store);
        for (User u : storeUsers) {
            u.setStore(null);
            u.setBranch(null);
            userRepository.save(u);
        }
        userRepository.flush();

        // 4. Delete branches
        branchRepository.deleteAll(branches);

        // 5. Delete products belonging to this store
        List<Product> products = productRepository.findByStoreId(id);
        for (Product p : products) {
            List<Inventory> productInventories = inventoryRepository.findByProductId(p.getId());
            if (productInventories != null && !productInventories.isEmpty()) {
                inventoryRepository.deleteAll(productInventories);
            }
        }
        productRepository.deleteAll(products);

        // 6. Delete categories belonging to this store
        List<Category> categories = categoryRepository.findByStoreId(id);
        categoryRepository.deleteAll(categories);

        storeRepository.delete(store);
    }

    @Override
    public StoreDTO getStoreByEmployee() throws UserException {

        User currentuser=userService.getCurrentUser();

        if(currentuser==null){
            throw new UserException("You do not have permission to access the store");
        }
        return StoreMapper.toDTO(currentuser.getStore());
    }

    @Override
    public StoreDTO moderateStore(Long id, StoreStatus status) throws Exception {

        Store store = storeRepository.findById(id).orElseThrow(
                ()->new Exception("Store not Found....")
        );

        store.setStatus(status);
        Store updatedStore=storeRepository.save(store);
        return StoreMapper.toDto(updatedStore);
    }
}
