package com.Anto.controller;


import com.Anto.payload.dto.ShiftReportDTO;
import com.Anto.service.ShiftReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/shift-reports")
public class ShiftReportController {

    private final ShiftReportService shiftReportService;

    @PostMapping("/start")
    public ResponseEntity<ShiftReportDTO> startShift() throws Exception {
        return ResponseEntity.ok(
                shiftReportService.startShift()
        );
    }

    @PatchMapping("/end")
    public ResponseEntity<ShiftReportDTO> endShift() throws Exception {
        return ResponseEntity.ok(
                shiftReportService.endShift(null, LocalDateTime.now())
        );
    }

    @GetMapping("/current")
    public ResponseEntity<ShiftReportDTO> getCurrentShiftProgress() throws Exception {
        ShiftReportDTO shift = shiftReportService.getCurrentShiftProgress(null);
        if (shift == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(shift);
    }

    @GetMapping("/cashier/{cashierId}/by-date")
    public ResponseEntity<ShiftReportDTO> getShiftReportByDate(
            @PathVariable Long cashierId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) throws Exception {
        return ResponseEntity.ok(
                shiftReportService.getShiftByCashierAndDate(cashierId, date.atStartOfDay())
        );
    }

    @GetMapping("/cashier/{cashierId}")
    public ResponseEntity<List<ShiftReportDTO>> getShiftReportByCashier(
            @PathVariable Long cashierId)
     throws Exception {
        return ResponseEntity.ok(
                shiftReportService.getShiftReportsByCashierId(cashierId)
        );
    }


    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<ShiftReportDTO>> getShiftReportByBranch(
            @PathVariable Long branchId)
            throws Exception {
        return ResponseEntity.ok(
                shiftReportService.getShiftReportsByBranchId(branchId)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShiftReportDTO> getShiftReportById(
            @PathVariable Long id)
            throws Exception {
        return ResponseEntity.ok(
                shiftReportService.getShiftReportById(id)
        );
    }





}
