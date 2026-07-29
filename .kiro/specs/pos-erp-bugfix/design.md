# POS/ERP System — Bugfix Design (18 Bugs)

## Overview

This design document formalizes the fix approach for 18 confirmed bugs found during a full backend
audit of the Spring Boot 4.1.0 Multi-Tenant POS/ERP SaaS system (`com.Anto`, MySQL `pos_sys`,
port 5000). The bugs span mapper stubs returning null, wrong service-method calls in controllers,
broken JSON serialization, incorrect field-assignment in update operations, a compilation-blocking
`pom.xml` misconfiguration, and missing runtime safeguards.

Each bug is addressed with: a formal bug condition (C), expected correct behavior (P), preservation
requirements (¬C), hypothesized root cause, specific implementation change, and a testing strategy
that covers exploratory, fix, and preservation checking.

---
