package com.Anto.modal;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

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

    @ManyToOne(fetch = FetchType.LAZY)
    private User cashier;

    @ManyToOne(fetch = FetchType.LAZY)
    private Branch branch;

    @ElementCollection
    @CollectionTable(name = "shift_report_payment_summaries", joinColumns = @JoinColumn(name = "shift_report_id"))
    @Builder.Default
    private List<PaymentSummary> paymentSummaries = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "shift_report_top_selling_products",
            joinColumns = @JoinColumn(name = "shift_report_id"),
            inverseJoinColumns = @JoinColumn(name = "product_id")
    )
    @Builder.Default
    private Set<Product> topSellingProducts = new HashSet<>();

    @Transient
    @Builder.Default
    private List<Order> recentOrders = new ArrayList<>();

    @OneToMany(mappedBy = "shiftReport", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Refund> refunds = new ArrayList<>();
}