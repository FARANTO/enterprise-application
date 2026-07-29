package com.Anto;

import com.Anto.configuration.JwtProvider;
import com.Anto.controller.CategoryController;
import com.Anto.controller.EmployeeController;
import com.Anto.controller.RefundController;
import com.Anto.controller.ShiftReportController;
import com.Anto.domain.PaymentType;
import com.Anto.domain.UserRole;
import com.Anto.exceptions.GlobalExceptionHandler;
import com.Anto.exceptions.UserException;
import com.Anto.mapper.BranchMapper;
import com.Anto.mapper.StoreMapper;
import com.Anto.mapper.UserMapper;
import com.Anto.modal.Branch;
import com.Anto.modal.Customer;
import com.Anto.modal.Order;
import com.Anto.modal.ShiftReport;
import com.Anto.modal.Store;
import com.Anto.modal.User;
import com.Anto.payload.dto.BranchDTO;
import com.Anto.payload.dto.CategoryDTO;
import com.Anto.payload.dto.ProductDTO;
import com.Anto.payload.dto.ShiftReportDTO;
import com.Anto.payload.dto.StoreDTO;
import com.Anto.payload.dto.UserDto;
import com.Anto.repository.BranchRepository;
import com.Anto.repository.CategoryRepository;
import com.Anto.repository.CustomerRepository;
import com.Anto.repository.OrderRepository;
import com.Anto.repository.ProductRepository;
import com.Anto.repository.RefundRepository;
import com.Anto.repository.ShiftReportRepository;
import com.Anto.repository.StoreRepository;
import com.Anto.repository.UserRepository;
import com.Anto.service.CategoryService;
import com.Anto.service.EmployeeService;
import com.Anto.service.RefundService;
import com.Anto.service.ShiftReportService;
import com.Anto.service.UserService;
import com.Anto.service.impl.AuthServiceImpl;
import com.Anto.service.impl.CustomUserImplementation;
import com.Anto.service.impl.CustomerServiceImpl;
import com.Anto.service.impl.EmployeeServiceImpl;
import com.Anto.service.impl.ProductServiceImpl;
import com.Anto.service.impl.ShiftReportServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.ElementCollection;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RegressionTests {

    @Test
    void storeMapperAliasAndBrandProduceAPopulatedDto() {
        Store store = new Store();
        store.setId(10L);
        store.setName("Main store");
        store.setBrand("TechMart");

        StoreDTO dto = StoreMapper.toDto(store);

        assertNotNull(dto);
        assertEquals(10L, dto.getId());
        assertEquals("Main store", dto.getName());
        assertEquals("TechMart", dto.getBrand());
    }

    @Test
    void branchMapperAliasCreatesABranch() {
        Store store = new Store();
        BranchDTO dto = BranchDTO.builder().name("Uttara").address("Dhaka").build();

        Branch branch = BranchMapper.toEntity(dto, store);

        assertNotNull(branch);
        assertEquals("Uttara", branch.getName());
        assertSame(store, branch.getStore());
    }

    @Test
    void userMapperHandlesBranchOnlyEmployees() {
        Branch branch = new Branch();
        branch.setId(3L);
        User user = new User();
        user.setBranch(branch);

        UserDto dto = assertDoesNotThrow(() -> UserMapper.toDTO(user));

        assertEquals(3L, dto.getBranchId());
        assertNull(dto.getStoreId());
    }

    @Test
    void productDtoUsesCamelCaseCategoryIdInJson() {
        ProductDTO dto = ProductDTO.builder().categoryId(4L).build();
        var json = new ObjectMapper().valueToTree(dto);
        assertTrue(json.has("categoryId"));
        assertFalse(json.has("CategoryId"));
    }

    @Test
    void categoryDtoExposesOnlyTheStoreId() {
        CategoryDTO dto = CategoryDTO.builder().storeId(6L).build();
        var json = new ObjectMapper().valueToTree(dto);
        assertEquals(6L, json.get("storeId").asLong());
        assertFalse(json.has("store"));
    }

    @Test
    void productUpdateUsesTheIncomingImagePriceAndBrand() throws Exception {
        ProductRepository productRepository = mock(ProductRepository.class);
        ProductServiceImpl service = new ProductServiceImpl(
                productRepository,
                mock(StoreRepository.class),
                mock(CategoryRepository.class),
                mock(com.Anto.repository.InventoryRepository.class),
                mock(com.Anto.repository.OrderItemRepository.class)
        );
        var product = new com.Anto.modal.Product();
        product.setName("Old name");
        product.setImage("old.png");
        when(productRepository.findById(9L)).thenReturn(Optional.of(product));
        when(productRepository.save(product)).thenReturn(product);
        ProductDTO update = ProductDTO.builder()
                .name("Widget")
                .image("widget.png")
                .sellingPrice(25.0)
                .brand("Acme")
                .build();

        service.updateProduct(9L, update, new User());

        assertEquals("Widget", product.getName());
        assertEquals("widget.png", product.getImage());
        assertEquals(25.0, product.getSellingPrice());
        assertEquals("Acme", product.getBrand());
    }

    @Test
    void lowercaseJwtLookupDelegatesToTheWorkingLookup() throws Exception {
        UserRepository userRepository = mock(UserRepository.class);
        JwtProvider jwtProvider = mock(JwtProvider.class);
        User expected = new User();
        when(jwtProvider.getEmailFromToken("Bearer token")).thenReturn("user@example.com");
        when(userRepository.findByEmail("user@example.com")).thenReturn(expected);

        User result = new com.Anto.service.impl.UserServiceImpl(userRepository, jwtProvider)
                .getUserFromJwttoken("Bearer token");

        assertSame(expected, result);
    }

    @Test
    void customerUpdateSavesTheExistingRecord() throws Exception {
        CustomerRepository customerRepository = mock(CustomerRepository.class);
        Customer existing = new Customer();
        existing.setId(7L);
        Customer incoming = new Customer();
        incoming.setFullName("Alice");
        incoming.setEmail("alice@example.com");
        incoming.setPhone("123");
        when(customerRepository.findById(7L)).thenReturn(Optional.of(existing));
        when(customerRepository.save(existing)).thenReturn(existing);

        Customer result = new CustomerServiceImpl(customerRepository).updateCustomer(7L, incoming);

        assertSame(existing, result);
        assertEquals("Alice", existing.getFullName());
        assertEquals("alice@example.com", existing.getEmail());
        verify(customerRepository).save(existing);
    }

    @Test
    void employeePasswordUpdatesAreEncoded() throws Exception {
        UserRepository userRepository = mock(UserRepository.class);
        BranchRepository branchRepository = mock(BranchRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        User existing = new User();
        Branch branch = new Branch();
        UserDto update = new UserDto();
        update.setPassword("new-secret");
        update.setBranchId(2L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(branchRepository.findById(2L)).thenReturn(Optional.of(branch));
        when(passwordEncoder.encode("new-secret")).thenReturn("encoded-secret");
        when(userRepository.save(existing)).thenReturn(existing);

        new EmployeeServiceImpl(userRepository, mock(StoreRepository.class), branchRepository, passwordEncoder)
                .updateEmployee(1L, update);

        assertEquals("encoded-secret", existing.getPassword());
        verify(passwordEncoder).encode("new-secret");
    }

    @Test
    void controllersCallTheCorrectServicesAndBindRoleAsARequestParameter() throws Exception {
        RefundService refundService = mock(RefundService.class);
        RefundController refundController = new RefundController(refundService);
        refundController.getRefundByBranch(11L);
        refundController.getRefundByShift(12L);
        verify(refundService).getRefundByBranch(11L);
        verify(refundService).getRefundByShiftReportId(12L);

        CategoryService categoryService = mock(CategoryService.class);
        new CategoryController(categoryService).deleteCategory(13L);
        verify(categoryService).deleteCategory(13L);

        EmployeeService employeeService = mock(EmployeeService.class);
        new EmployeeController(employeeService).storeEmployee(14L, UserRole.ROLE_BRANCH_CASHIER);
        verify(employeeService).findStoreEmployees(14L, UserRole.ROLE_BRANCH_CASHIER);
        assertTrue(EmployeeController.class
                .getMethod("storeEmployee", Long.class, UserRole.class)
                .getParameters()[1]
                .isAnnotationPresent(RequestParam.class));
    }

    @Test
    void shiftEndControllerSendsANonNullTimestamp() throws Exception {
        ShiftReportService shiftReportService = mock(ShiftReportService.class);
        when(shiftReportService.endShift(isNull(), any(LocalDateTime.class)))
                .thenReturn(ShiftReportDTO.builder().build());
        ShiftReportController controller = new ShiftReportController(shiftReportService);
        ArgumentCaptor<LocalDateTime> timestamp = ArgumentCaptor.forClass(LocalDateTime.class);

        controller.endShift();

        verify(shiftReportService).endShift(isNull(), timestamp.capture());
        assertNotNull(timestamp.getValue());
    }

    @Test
    void signupCreatesATokenWithTheUsersRole() throws Exception {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        JwtProvider jwtProvider = mock(JwtProvider.class);
        AtomicReference<Authentication> tokenAuthentication = new AtomicReference<>();
        when(userRepository.findByEmail("cashier@example.com")).thenReturn(null);
        when(passwordEncoder.encode("secret")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtProvider.generateToken(any(Authentication.class))).thenAnswer(invocation -> {
            tokenAuthentication.set(invocation.getArgument(0));
            return "jwt";
        });
        UserDto signup = new UserDto();
        signup.setEmail("cashier@example.com");
        signup.setPassword("secret");
        signup.setRole(UserRole.ROLE_BRANCH_CASHIER);

        new AuthServiceImpl(userRepository, passwordEncoder, jwtProvider, mock(CustomUserImplementation.class))
                .signup(signup);

        assertEquals("ROLE_BRANCH_CASHIER", tokenAuthentication.get().getAuthorities().iterator().next().getAuthority());
    }

    @Test
    void userExceptionsProduceAStructuredBadRequestResponse() {
        var response = new GlobalExceptionHandler().handleUserException(new UserException("Invalid user"));
        assertEquals(400, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("Invalid user", response.getBody().getMessage());
    }

    @Test
    void shiftCalculationUsesARealEndTimeAndNeverProducesNanPercentages() throws Exception {
        ShiftReportRepository shiftReportRepository = mock(ShiftReportRepository.class);
        UserService userService = mock(UserService.class);
        RefundRepository refundRepository = mock(RefundRepository.class);
        OrderRepository orderRepository = mock(OrderRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        ShiftReportServiceImpl service = new ShiftReportServiceImpl(
                shiftReportRepository,
                userService,
                mock(BranchRepository.class),
                refundRepository,
                orderRepository,
                userRepository
        );

        Branch branch = new Branch();
        branch.setId(2L);
        User cashier = new User();
        cashier.setId(1L);
        ShiftReport shift = ShiftReport.builder()
                .id(5L)
                .cashier(cashier)
                .branch(branch)
                .shiftStart(LocalDateTime.now().minusHours(1))
                .build();
        Order zeroValueOrder = Order.builder()
                .totalAmount(0.0)
                .paymentType(PaymentType.CASH)
                .items(Collections.emptyList())
                .createdAt(LocalDateTime.now())
                .build();
        when(userService.getCurrentUser()).thenReturn(cashier);
        when(shiftReportRepository.findTopByCashierAndShiftEndIsNullOrderByShiftStartDesc(cashier))
                .thenReturn(Optional.of(shift));
        when(refundRepository.findByCashierIdAndCreatedAtBetween(eq(1L), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());
        when(orderRepository.findByCashierAndCreatedAtBetween(eq(cashier), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(zeroValueOrder));
        when(shiftReportRepository.save(any(ShiftReport.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ShiftReportDTO result = service.endShift(null, null);

        assertNotNull(result.getShiftEnd());
        assertEquals(0.0, shift.getPaymentSummaries().get(0).getPercentage());
        assertTrue(ShiftReport.class.getDeclaredField("paymentSummaries").isAnnotationPresent(ElementCollection.class));
    }
}