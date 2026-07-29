package com.Anto.service;

import com.Anto.payload.dto.UserDto;

import java.util.List;

public interface AdminService {

    List<UserDto> getAllAdmins() throws Exception;

    void deleteAdmin(Long id) throws Exception;

    UserDto assignStoreAndBranch(Long id, Long storeId, Long branchId) throws Exception;
}
