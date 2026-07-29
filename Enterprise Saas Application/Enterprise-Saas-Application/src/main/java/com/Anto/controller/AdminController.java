package com.Anto.controller;

import com.Anto.payload.dto.UserDto;
import com.Anto.payload.response.ApiResponse;
import com.Anto.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admins")
public class AdminController {

    private final AdminService adminService;

    /**
     * GET /api/admins
     * Returns a list of all admin users.
     */
    @GetMapping
    public ResponseEntity<List<UserDto>> getAllAdmins() throws Exception {
        return ResponseEntity.ok(adminService.getAllAdmins());
    }

    /**
     * DELETE /api/admins/{id}
     * Deletes an admin user by id.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteAdmin(@PathVariable Long id) throws Exception {
        adminService.deleteAdmin(id);
        ApiResponse response = new ApiResponse();
        response.setMessage("Admin deleted successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/admins/{id}/assign
     * Assigns a store and/or branch to an admin.
     */
    @PutMapping("/{id}/assign")
    public ResponseEntity<UserDto> assignStoreAndBranch(
            @PathVariable Long id,
            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) Long branchId) throws Exception {
        return ResponseEntity.ok(adminService.assignStoreAndBranch(id, storeId, branchId));
    }
}
