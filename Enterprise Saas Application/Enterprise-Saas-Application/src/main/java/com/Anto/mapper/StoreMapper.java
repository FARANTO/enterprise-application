package com.Anto.mapper;

import com.Anto.modal.Store;
import com.Anto.modal.User;
import com.Anto.payload.dto.StoreDTO;

public class StoreMapper {

    public static StoreDTO toDTO(Store store) {
        if (store == null) {
            return null;
        }

        StoreDTO storeDTO = new StoreDTO();
        storeDTO.setId(store.getId());
        storeDTO.setName(store.getName());
        storeDTO.setBrand(store.getBrand());
        storeDTO.setDescription(store.getDescription());
        storeDTO.setStoreAdmin(UserMapper.toDTO(store.getStoreAdmin()));
        storeDTO.setStoreType(store.getStoreType());
        storeDTO.setContact(store.getContact());
        storeDTO.setCreatedAt(store.getCreatedAt());
        storeDTO.setUpdatedAt(store.getUpdatedAt());
        storeDTO.setStatus(store.getStatus());

        return storeDTO;
    }
    public static Store toEntity(StoreDTO storeDTO, User storeAdmin) {
        if (storeDTO == null) {
            return null;
        }

        Store store = new Store();
        store.setName(storeDTO.getName());
        store.setBrand(storeDTO.getBrand());
        store.setDescription(storeDTO.getDescription());
        store.setStoreAdmin(storeAdmin);
        store.setStoreType(storeDTO.getStoreType());
        store.setContact(storeDTO.getContact());
        store.setCreatedAt(storeDTO.getCreatedAt());
        store.setUpdatedAt(storeDTO.getUpdatedAt());

        return store;
    }

    public static StoreDTO toDto(Store save) {
        return toDTO(save);
    }
}
