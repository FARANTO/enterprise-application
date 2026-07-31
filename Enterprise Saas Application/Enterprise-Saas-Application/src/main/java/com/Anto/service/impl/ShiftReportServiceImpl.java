package com.Anto.service.impl;

import com.Anto.domain.PaymentType;
import com.Anto.mapper.ShiftReportMapper;
import com.Anto.modal.*;
import com.Anto.payload.dto.ShiftReportDTO;
import com.Anto.repository.*;
import com.Anto.service.ShiftReportService;
import com.Anto.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShiftReportServiceImpl implements ShiftReportService {

    private final ShiftReportRepository shiftReportRepository;
    private final UserService userService;
    private final BranchRepository branchRepository;
    private final RefundRepository refundRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @Override
    public ShiftReportDTO startShift() throws Exception {
        User currentUser = userService.getCurrentUser();
        LocalDateTime shiftStart = LocalDateTime.now();

        Optional<ShiftReport> activeShift = shiftReportRepository
                .findTopByCashierAndShiftEndIsNullOrderByShiftStartDesc(currentUser);

        if (activeShift.isPresent()) {
            return ShiftReportMapper.toDTO(activeShift.get());
        }

        Branch branch = currentUser.getBranch();
        ShiftReport shiftReport = ShiftReport.builder()
                .cashier(currentUser)
                .shiftStart(shiftStart)
                .branch(branch)
                .build();

        ShiftReport savedReport = shiftReportRepository.save(shiftReport);
        return ShiftReportMapper.toDTO(savedReport);
    }

    @Override
    public ShiftReportDTO endShift(Long shiftReportId, LocalDateTime shiftEnd) throws Exception {
        User currentUser = userService.getCurrentUser();

        ShiftReport shiftReport;
        if (shiftReportId != null) {
            shiftReport = shiftReportRepository.findById(shiftReportId)
                    .orElseThrow(() -> new Exception("Shift Report Not Found"));
            if (!currentUser.getId().equals(shiftReport.getCashier().getId()) || shiftReport.getShiftEnd() != null) {
                throw new Exception("Shift Report Not Found");
            }
        } else {
            shiftReport = shiftReportRepository.findTopByCashierAndShiftEndIsNullOrderByShiftStartDesc(currentUser)
                    .orElseThrow(() -> new Exception("Shift Report Not Found"));
        }

        shiftReport.setShiftEnd(shiftEnd != null ? shiftEnd : LocalDateTime.now());

        List<Refund> refunds = refundRepository.findByCashierIdAndCreatedAtBetween(
                currentUser.getId(), shiftReport.getShiftStart(), shiftReport.getShiftEnd());

        double totalRefunds = refunds.stream()
                .mapToDouble(r -> r.getAmount() != null ? r.getAmount() : 0.0).sum();

        List<Order> orders = orderRepository.findByCashierAndCreatedAtBetween(
                currentUser, shiftReport.getShiftStart(), shiftReport.getShiftEnd());

        double totalSales = orders.stream().mapToDouble(Order::getTotalAmount).sum();
        int totalOrders = orders.size();
        double netSales = totalSales - totalRefunds;

        shiftReport.setTotalRefunds(totalRefunds);
        shiftReport.setTotalSales(totalSales);
        shiftReport.setTotalOrders(totalOrders);
        shiftReport.setNetSales(netSales);

        // recentOrders is Transient - for DTO only, not saved to DB
        shiftReport.setRecentOrders(getRecentOrders(orders));

        // FIX: clear before add to avoid duplicate FK inserts
        Set<Product> topProducts = new LinkedHashSet<>(getTopSellingProducts(orders));
        if (shiftReport.getTopSellingProducts() == null) {
            shiftReport.setTopSellingProducts(topProducts);
        } else {
            shiftReport.getTopSellingProducts().clear();
            shiftReport.getTopSellingProducts().addAll(topProducts);
        }

        shiftReport.setPaymentSummaries(getPaymentSummaries(orders, totalSales));
        refunds.forEach(refund -> refund.setShiftReport(shiftReport));
        // FIX: Do NOT replace the refunds collection – modify the existing one
        shiftReport.getRefunds().clear();
        shiftReport.getRefunds().addAll(refunds);

        ShiftReport savedReport = shiftReportRepository.save(shiftReport);
        return ShiftReportMapper.toDTO(savedReport);
    }

    @Override
    public ShiftReportDTO getShiftReportById(Long id) throws Exception {
        return shiftReportRepository.findById(id).map(ShiftReportMapper::toDTO)
                .orElseThrow(() -> new Exception("Shift Report not found id : " + id));
    }

    @Override
    public List<ShiftReportDTO> getAllShiftReports() {
        return shiftReportRepository.findAll().stream().map(ShiftReportMapper::toDTO).collect(Collectors.toList());
    }

    @Override
    public List<ShiftReportDTO> getShiftReportsByBranchId(Long branchId) {
        return shiftReportRepository.findByBranchId(branchId).stream().map(ShiftReportMapper::toDTO).collect(Collectors.toList());
    }

    @Override
    public List<ShiftReportDTO> getShiftReportsByCashierId(Long cashierId) {
        return shiftReportRepository.findByCashierId(cashierId).stream().map(ShiftReportMapper::toDTO).collect(Collectors.toList());
    }

    @Override
    public ShiftReportDTO getCurrentShiftProgress(Long cashierId) throws Exception {
        User user = userService.getCurrentUser();

        Optional<ShiftReport> optionalShiftReport = shiftReportRepository
                .findTopByCashierAndShiftEndIsNullOrderByShiftStartDesc(user);
        if (optionalShiftReport.isEmpty()) {
            return null;
        }

        ShiftReport shiftReport = optionalShiftReport.get();
        LocalDateTime now = LocalDateTime.now();

        List<Order> orders = orderRepository.findByCashierAndCreatedAtBetween(user, shiftReport.getShiftStart(), now);
        List<Refund> refunds = refundRepository.findByCashierIdAndCreatedAtBetween(user.getId(), shiftReport.getShiftStart(), now);

        double totalRefunds = refunds.stream().mapToDouble(r -> r.getAmount() != null ? r.getAmount() : 0.0).sum();
        double totalSales = orders.stream().mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0.0).sum();
        int totalOrders = orders.size();
        double netSales = totalSales - totalRefunds;

        shiftReport.setTotalRefunds(totalRefunds);
        shiftReport.setTotalSales(totalSales);
        shiftReport.setTotalOrders(totalOrders);
        shiftReport.setNetSales(netSales);

        shiftReport.setRecentOrders(getRecentOrders(orders));

        Set<Product> topProducts = new LinkedHashSet<>(getTopSellingProducts(orders));
        if (shiftReport.getTopSellingProducts() == null) {
            shiftReport.setTopSellingProducts(topProducts);
        } else {
            shiftReport.getTopSellingProducts().clear();
            shiftReport.getTopSellingProducts().addAll(topProducts);
        }

        shiftReport.setPaymentSummaries(getPaymentSummaries(orders, totalSales));
        refunds.forEach(refund -> refund.setShiftReport(shiftReport));
        // FIX: Do NOT replace the refunds collection – modify the existing one
        shiftReport.getRefunds().clear();
        shiftReport.getRefunds().addAll(refunds);

        ShiftReport savedReport = shiftReportRepository.save(shiftReport);
        return ShiftReportMapper.toDTO(savedReport);
    }

    @Override
    public ShiftReportDTO getShiftByCashierAndDate(Long cashierId, LocalDateTime date) throws Exception {
        User cashier = userRepository.findById(cashierId)
                .orElseThrow(() -> new Exception("Cashier Not Found with given ID : " + cashierId));

        LocalDateTime start = date.withHour(0).withMinute(0).withSecond(0);
        LocalDateTime end = date.withHour(23).withMinute(59).withSecond(59);

        ShiftReport report = shiftReportRepository.findByCashierAndShiftStartBetween(cashier, start, end)
                .orElseThrow(() -> new Exception("Shift Report Not Found For Cashier" + cashierId));

        return ShiftReportMapper.toDTO(report);
    }

    private List<PaymentSummary> getPaymentSummaries(List<Order> orders, double totalSales) {
        Map<PaymentType, List<Order>> grouped = orders.stream()
                .collect(Collectors.groupingBy(o -> o.getPaymentType() != null ? o.getPaymentType() : PaymentType.CASH));

        List<PaymentSummary> summaries = new ArrayList<>();
        for (Map.Entry<PaymentType, List<Order>> entry : grouped.entrySet()) {
            double amount = entry.getValue().stream()
                    .mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0.0).sum();
            int transactions = entry.getValue().size();
            double percent = totalSales == 0 ? 0 : (amount / totalSales) * 100;

            PaymentSummary ps = new PaymentSummary();
            ps.setType(entry.getKey());
            ps.setTotalAmount(amount);
            ps.setTransactionCount(transactions);
            ps.setPercentage(percent);
            summaries.add(ps);
        }
        return summaries;
    }

    private List<Product> getTopSellingProducts(List<Order> orders) {
        Map<Product, Integer> productSalesMap = new HashMap<>();
        for (Order order : orders) {
            if (order.getItems() == null) continue;
            for (OrderItem item : order.getItems()) {
                if (item.getProduct() == null || item.getQuantity() == null) continue;
                Product product = item.getProduct();
                productSalesMap.put(product, productSalesMap.getOrDefault(product, 0) + item.getQuantity());
            }
        }
        return productSalesMap.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(5)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    private List<Order> getRecentOrders(List<Order> orders) {
        return orders.stream()
                .sorted(Comparator.comparing(Order::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .limit(5)
                .collect(Collectors.toList());
    }
}