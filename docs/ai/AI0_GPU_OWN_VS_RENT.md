# AgroMind AI — Owned GPU vs Rented GPU: Decision Model

**Status:** non-binding infrastructure comparison, **not a purchase recommendation or supplier quote**, 2026-10-30. See [GPU hourly price snapshot](AI0_GPU_COST_MATRIX.md) for source/tier uncertainty.

## Decision question

Buying a card replaces a recurring *GPU rental* with **capital expenditure**, but it does **not** remove costs of CPU/server, PSU, storage, cooling, networking/ISP, electricity, backup power, secure hosting, monitoring, repair, downtime or staff time. An owned GPU also does not guarantee the necessary model/context/concurrency fits. No GPU is purchased or installed.

## Reference capacities and maximum **board** consumption

| Example device | GPU memory | Published maximum board power | 730h upper bound if running at max board power |
| --- | --- | --- | --- |
| [NVIDIA RTX A5000](https://www.nvidia.com/en-in/products/workstations/rtx-a5000/) | 24 GB ECC GDDR6 | **230 W** | **167.9 kWh** |
| [MSI GeForce RTX 3090 Ventus 3X](https://www.msi.com/Graphics-Card/GeForce-RTX-3090-VENTUS-3X-24G/Specification) | 24 GB GDDR6X | **350 W** | **255.5 kWh** |

These are **max-board-power scenarios** (power × 730 hours / 1000), **not actual energy consumption**, measured system watts or monthly electricity bills. Real duty cycle changes power. Add **CPU, RAM, drives, PSU losses, cooling, UPS** and local tariffs. Workstation ECC, operational availability, physical condition and local support can matter more than a low card price.

## Five inputs to collect before any purchase

1. Total acquisition: GPU + compatible server/workstation, RAM/CPU, PSU, SSD, case/rack, UPS, network security, installation and taxes.
2. Effective operating cost per month: wall-meter kWh × local tariff, cooling, backup, connectivity with public IP or secure tunnel, monitoring/patches and staff time.
3. Availability/risk: ISP and grid reliability, ability to respond to outages, warranty and replacement stock, tenant isolation and security response.
4. Measured usage: request count, output tokens, concurrency, context length, actual GPU utilization and acceptable first-token/response latency.
5. Cloud comparator: same **GPU class and tested model capacity**, comparable uptime/SLA, persistent storage/egress, selectable region and final billable tier.

## TCO model — same observation horizon and currency

```text
owned_total_H_months =
    full_server_purchase
  + sum(monthly_electricity + cooling + internet_delta + UPS_service
        + maintenance + operations + expected_downtime_cost for H months)
  - defensible_residual_hardware_value_at_H

rented_total_H_months =
    sum(billed_GPU_hours * actual_GPU_hourly_rate
        + cloud_storage + egress + CPU/RAM/embedding + operations
        + expected_outage_cost for H months)

break_even_months is when owned_total_H <= rented_total_H
and hardware capacity, security and service objectives are equivalent.
```

**Example only:** the previously documented RTX A5000 public Runpod rate was **$0.27/hour** in a displayed tier on the reviewed date. Multiplying 730h × 0.27 yields **$197.10/mo** GPU rental *before* other charges, while 20h costs **$5.40**. These are **not** exchange-rate converted and do not establish a local card price, the current available tier or model inference throughput. A user-supplied 51-million-toman estimate is not a verified procurement quote.

For a pilot with 20–80 GPU-hours/month, hardware capital can dominate. For a genuinely 24/7 service with stable, high utilization, buying may win **if** reliable in-house operations and realistic capacity are demonstrated. Choose after benchmarking, not from monthly dollar multiplication alone.

**Recommendation for research scope (not purchase):** use offline CPU/unit tests first; if real GPU inference is authorized, compare rented 24 GB and 48 GB classes with one checked model and a hard spend cap. Evaluate an owned workstation proposal only with a credible local quotation and measured operating requirements.

## Gate

No purchase, GPU rental, paid account, production migration or public model service is approved by this document. All security boundaries from [AI strategy](../AGROMIND_AI_ARCHITECTURE_MODEL_STRATEGY.md) and [Security First](../SECURITY_FIRST.md) remain.
