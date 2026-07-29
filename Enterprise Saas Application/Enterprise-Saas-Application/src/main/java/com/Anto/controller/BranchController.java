package com.Anto.controller;


import com.Anto.payload.dto.BranchDTO;
import com.Anto.payload.response.ApiResponse;
import com.Anto.repository.BranchRepository;
import com.Anto.service.BranchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/branches")
public class BranchController {

    private final BranchService branchService;


    @PostMapping
    public ResponseEntity<BranchDTO> createBranch(@RequestBody BranchDTO branchDTO) throws  Exception {
        BranchDTO createdBranch=branchService.createBranch(branchDTO);
        return ResponseEntity.ok(createdBranch);
    }

    @GetMapping
    public ResponseEntity<List<BranchDTO>> getAllBranches() throws Exception {
        return ResponseEntity.ok(branchService.getAllBranches());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BranchDTO> getBranchById(@PathVariable Long id) throws  Exception {
        BranchDTO createdBranch=branchService.getBranchById(id);
        return ResponseEntity.ok(createdBranch);
    }

    @GetMapping("/store/{storeid}")
    public ResponseEntity<List<BranchDTO>> getAllBranchByStoreId(@PathVariable Long storeid) throws  Exception {
        List<BranchDTO> createdBranch=branchService.getAllBranchesByStoreId(storeid);
        return ResponseEntity.ok(createdBranch);
    }



    @PutMapping("/{id}")
    public ResponseEntity<BranchDTO> updateBranch(@PathVariable Long id,
        @RequestBody BranchDTO branchDTO        ) throws  Exception {

        BranchDTO createdBranch=branchService.updateBranch(id,branchDTO);
        return ResponseEntity.ok(createdBranch);
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteBranchbyId(
            @PathVariable Long id) throws  Exception {
        branchService.deleteBranch(id);
        ApiResponse apiResponse = new ApiResponse();
        apiResponse.setMessage("Branch has been deleted successfully");
        return ResponseEntity.ok(apiResponse);
    }

}
