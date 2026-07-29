package com.Anto.service.impl;

import com.Anto.domain.OrderStatus;
import com.Anto.domain.PaymentType;
import com.Anto.mapper.OrderMapper;
import com.Anto.modal.Branch;
import com.Anto.modal.Customer;
import com.Anto.modal.Order;
import com.Anto.modal.OrderItem;
import com.Anto.modal.Product;
import com.Anto.modal.Store;
import com.Anto.modal.User;
import com.Anto.payload.dto.OrderDTO;
import com.Anto.repository.BranchRepository;
import com.Anto.repository.CustomerRepository;
import com.Anto.repository.OrderItemRepository;
import com.Anto.repository.OrderRepository;
import com.Anto.repository.ProductRepository;
import com.Anto.repository.StoreRepository;
import com.Anto.service.OrderService;
import com.Anto.service.UserService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {
    private final UserService userService;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final BranchRepository branchRepository;
    private final CustomerRepository customerRepository;
    private final StoreRepository storeRepository;

    @Override
    public OrderDTO createOrder(OrderDTO orderDTO) throws Exception {
        User cashier = null;
        try {
            cashier = userService.getCurrentUser();
        } catch (Exception e) {
            // Cashier token might be system admin or null
        }

        Branch branch = cashier != null ? cashier.getBranch() : null;
        if (branch == null && orderDTO.getBranchId() != null) {
            branch = branchRepository.findById(orderDTO.getBranchId()).orElse(null);
        }

        // Fallback 1: Cashier's store branches
        if (branch == null && cashier != null && cashier.getStore() != null) {
            List<Branch> storeBranches = branchRepository.findByStoreId(cashier.getStore().getId());
            if (storeBranches != null && !storeBranches.isEmpty()) {
                branch = storeBranches.get(0);
            }
        }

        // Fallback 2: Product store branches
        if (branch == null && orderDTO.getItems() != null && !orderDTO.getItems().isEmpty()) {
            Long firstProdId = orderDTO.getItems().get(0).getProductId();
            if (firstProdId != null) {
                Product p = productRepository.findById(firstProdId).orElse(null);
                if (p != null && p.getStore() != null) {
                    List<Branch> storeBranches = branchRepository.findByStoreId(p.getStore().getId());
                    if (storeBranches != null && !storeBranches.isEmpty()) {
                        branch = storeBranches.get(0);
                    }
                }
            }
        }

        // Fallback 3: First available branch in system
        if (branch == null) {
            List<Branch> allBranches = branchRepository.findAll();
            if (allBranches != null && !allBranches.isEmpty()) {
                branch = allBranches.get(0);
            }
        }

        // Fallback 4: Auto-create default branch if system has zero branches
        if (branch == null) {
            Store store = storeRepository.findAll().stream().findFirst().orElse(null);
            if (store == null) {
                Store newStore = new Store();
                newStore.setName("Main Store");
                newStore.setStoreAdmin(cashier);
                store = storeRepository.save(newStore);
            }
            Branch newBranch = Branch.builder()
                    .name("Main Branch")
                    .store(store)
                    .build();
            branch = branchRepository.save(newBranch);
        }

        Customer customer = orderDTO.getCustomer();
        if (customer == null && orderDTO.getCustomerId() != null) {
            customer = customerRepository.findById(orderDTO.getCustomerId()).orElse(null);
        }

        Order order = Order.builder()
                .branch(branch)
                .cashier(cashier)
                .customer(customer)
                .paymentType(orderDTO.getPaymentType())
                .build();

        List<OrderItem> orderItems = (orderDTO.getItems() != null ? orderDTO.getItems() : List.<com.Anto.payload.dto.OrderItemDTO>of())
                .stream().map(itemDto -> {
                    Product product = productRepository.findById(itemDto.getProductId()).orElseThrow(
                            () -> new EntityNotFoundException("Product Not found with id: " + itemDto.getProductId())
                    );
                    double unitPrice = product.getSellingPrice() != null ? product.getSellingPrice() : (itemDto.getPrice() != null ? itemDto.getPrice() : 0.0);
                    int qty = itemDto.getQuantity() != null ? itemDto.getQuantity() : 1;
                    return OrderItem.builder()
                            .product(product)
                            .quantity(qty)
                            .price(unitPrice * qty)
                            .order(order)
                            .build();
                }).toList();

        double total = orderItems.stream().mapToDouble(OrderItem::getPrice).sum();
        order.setTotalAmount(total > 0 ? total : (orderDTO.getTotalAmount() != null ? orderDTO.getTotalAmount() : 0.0));
        order.setItems(orderItems);

        Order savedOrder = orderRepository.save(order);
        return OrderMapper.toDTO(savedOrder);
    }

    @Override
    public OrderDTO getOrderById(Long id) throws Exception {
        return orderRepository.findById(id)
                .map(OrderMapper::toDTO).orElseThrow(
                () -> new Exception("Order Not Found with id " + id)
        );
    }

    @Override
    public List<OrderDTO> getOrdersByBranch(Long branchId, Long customerId, Long cashierId, PaymentType paymentType, OrderStatus status) throws Exception {
        return orderRepository.findByBranchId(branchId).stream()
                .filter(order -> customerId == null || (order.getCustomer() != null && order.getCustomer().getId().equals(customerId)))
                .filter(order -> cashierId == null || (order.getCashier() != null && order.getCashier().getId().equals(cashierId)))
                .filter(order -> paymentType == null || order.getPaymentType() == paymentType)
                .map(OrderMapper::toDTO).collect(Collectors.toList());
    }

    @Override
    public List<OrderDTO> getOrderByCashier(Long cashierId) {
        return orderRepository.findByCashierId(cashierId).stream().map(OrderMapper::toDTO).collect(Collectors.toList());
    }

    @Override
    public void deleteOrder(Long id) throws Exception {
        Order order = orderRepository.findById(id).orElseThrow(
                () -> new Exception("Order Not Found with id " + id)
        );
        orderRepository.delete(order);
    }

    @Override
    public List<OrderDTO> getTodayOrdersByBranch(Long branchId) throws Exception {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();

        return orderRepository.findByBranchIdAndCreatedAtBetween(
                branchId, start, end
        ).stream()
                .map(OrderMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderDTO> getOrdersByCustomerId(Long customerId) throws Exception {
        return orderRepository.findByCustomerId(customerId).stream().map(OrderMapper::toDTO).collect(Collectors.toList());
    }

    @Override
    public List<OrderDTO> getTop5RecentOrdersByBranchId(Long branchId) throws Exception {
        return orderRepository.findTop5ByBranchIdOrderByCreatedAtDesc(branchId).stream().map(OrderMapper::toDTO).collect(Collectors.toList());
    }

    @Override
    public List<OrderDTO> getOrdersByStore(Long storeId) throws Exception {
        return orderRepository.findByStoreId(storeId).stream().map(OrderMapper::toDTO).collect(Collectors.toList());
    }
}
