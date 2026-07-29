package com.Anto.modal;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ShiftReport {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private LocalDateTime shiftStart;
    private LocalDateTime shiftEnd;

    private Double totalSales;
    private Double totalRefunds;
    private Double netSales;
    private int totalOrders;

    @ManyToOne
    private User cashier;

    @ManyToOne
    private Branch branch;

    @ElementCollection
    @CollectionTable(name = "shift_report_payment_summaries", joinColumns = @JoinColumn(name = "shift_report_id"))
    private List<PaymentSummary> paymentSummaries;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "shift_report_top_selling_products",
            joinColumns = @JoinColumn(name = "shift_report_id"),
            inverseJoinColumns = @JoinColumn(name = "product_id")
    )
    private java.util.Set<Product> topSellingProducts;

    @OneToMany(cascade = CascadeType.ALL)
    private java.util.List<Order> recentOrders;

    @OneToMany(mappedBy = "shiftReport", cascade = CascadeType.ALL)
    private List<Refund> refunds;






}
