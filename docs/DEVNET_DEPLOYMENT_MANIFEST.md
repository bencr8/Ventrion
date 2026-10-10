# 🚀 Ventrion Protocol ($VENT) - Solana Devnet Deployment Manifest

## 1. Protocol Architecture & Deployment Overview
* **Network:** Solana Devnet (`https://api.devnet.solana.com`)
* **Program ID:** [`AFjLicxsyXYB2sCPpfHtsgDzSeRjTXxnZk8x6zN25mvD`](https://explorer.solana.com/address/AFjLicxsyXYB2sCPpfHtsgDzSeRjTXxnZk8x6zN25mvD?cluster=devnet)
* **Program Data Account:** [`HT6pXjhA57GPjGMyhZmVSFWJU8pqkEAY895aX7SnLeGp`](https://explorer.solana.com/address/HT6pXjhA57GPjGMyhZmVSFWJU8pqkEAY895aX7SnLeGp?cluster=devnet)
* **Deployed Slot:** `509591014`
* **Deployed At:** October 10, 2026

---

## 2. Core Protocol Tokens
* **Mother-Token ($VENT) Mint:** [`5MJffbYDKokyemXzu6YXW2jHd9VPq9Sv1HKPt1xZAAgJ`](https://explorer.solana.com/address/5MJffbYDKokyemXzu6YXW2jHd9VPq9Sv1HKPt1xZAAgJ?cluster=devnet)
* **Settlement USDC Mint (Devnet):** [`5dPaWuSzqwQiqP4JqmB8d7HxvigZfBEVFKbR3GNnvUYt`](https://explorer.solana.com/address/5dPaWuSzqwQiqP4JqmB8d7HxvigZfBEVFKbR3GNnvUYt?cluster=devnet)

---

## 3. Global Configuration & Berkshire Hathaway Holding Treasury
* **Global Config PDA:** [`E8xXQTv9jpeYHGEQYeaPUxTZ6HLJx8KqgzozYqHFUuEa`](https://explorer.solana.com/address/E8xXQTv9jpeYHGEQYeaPUxTZ6HLJx8KqgzozYqHFUuEa?cluster=devnet)
* **Master Fee Vault PDA (Platform Royalty Treasury):** [`5BPnjZ6yPQtVK2tSJ4dYzD8mwzNnJxiP9fcVuKK4RbEV`](https://explorer.solana.com/address/5BPnjZ6yPQtVK2tSJ4dYzD8mwzNnJxiP9fcVuKK4RbEV?cluster=devnet)
* **$VENT Staking Vault PDA:** [`EB6KLGyxnCLH3pu26VvwVx7GTocGXg2CVwtkkRyYEnik`](https://explorer.solana.com/address/EB6KLGyxnCLH3pu26VvwVx7GTocGXg2CVwtkkRyYEnik?cluster=devnet)
* **Ecosystem Protocol Cut:** `0.5%` (50 bps) LP fee cut + `3%` graduation fee.
* **$VENT Governance Bootstrapping:** `500,000 $VENT` staked on-chain (`MIN_VENT_STAKED_THRESHOLD` satisfied).

---

## 4. Live Pioneer Venture: Apex Quantum ($APEX)
* **Company Common Shares Mint:** [`J8krWMkHe24H18BmkWtV4WJZEdJcNcZShcP7RwkAHeWn`](https://explorer.solana.com/address/J8krWMkHe24H18BmkWtV4WJZEdJcNcZShcP7RwkAHeWn?cluster=devnet)
* **Venture State PDA:** [`9jcEfp6A3Ro6jJ9vic44iFPmW1Px1aeAG2U7naCvcRJv`](https://explorer.solana.com/address/9jcEfp6A3Ro6jJ9vic44iFPmW1Px1aeAG2U7naCvcRJv?cluster=devnet)
* **Total Common Share Supply:** `1,000,000` common shares (Fixed invariant).
* **Primary Round Terms:** $0.25 USDC / share, $50,000 USDC target cap, 200,000 shares for sale.
* **Founder Vesting Allocation:** `766,000` shares (linear monthly release with cliff).
* **Meteora Seed Allocation:** `170,000` shares (held in custody for atomic graduation).
* **Milestone Tranche Escrow:** 3 milestones configured (40%, 35%, 25%) with 7-day optimistic release, 3 cure cycles, and pro-rata ragequit refund protection.

---

## 5. Verified On-Chain Transaction Signatures
| Lifecycle Action | Transaction Signature | Solana Explorer Link |
| :--- | :--- | :--- |
| **Global Config Initialization** | `3ca7SDcXVpgtjQRse97HQueapqeFqsa4rxTzT1jX3irmEEtHre793xBmK9XR3VnNk413xdADtmsmv8czsTmTkwEh` | [Explorer](https://explorer.solana.com/tx/3ca7SDcXVpgtjQRse97HQueapqeFqsa4rxTzT1jX3irmEEtHre793xBmK9XR3VnNk413xdADtmsmv8czsTmTkwEh?cluster=devnet) |
| **$VENT Staking Bootstrapping (500k $VENT)** | `2FbJrNQRJpsUUNzrkEiY5VH9X5Eh1hFycvzUpTLnBNkagDfRfDoUHcEnybRqpiWgyjh5if15pUYZvZLaCrZYHRC1` | [Explorer](https://explorer.solana.com/tx/2FbJrNQRJpsUUNzrkEiY5VH9X5Eh1hFycvzUpTLnBNkagDfRfDoUHcEnybRqpiWgyjh5if15pUYZvZLaCrZYHRC1?cluster=devnet) |
| **Apex Quantum Genesis Launch** | `59fcHjn33hV3i87roC8FGYovKvVYNRHzMjV9HfHEFfSKyGsBniArU2Xpz4StCQEtivZ9y2sYkhTc4PYCxdajG9bS` | [Explorer](https://explorer.solana.com/tx/59fcHjn33hV3i87roC8FGYovKvVYNRHzMjV9HfHEFfSKyGsBniArU2Xpz4StCQEtivZ9y2sYkhTc4PYCxdajG9bS?cluster=devnet) |
| **Tranche Milestones Configuration** | `8snnvAfhyZH5ndeThK7bfRFQzbwanZNNRDK85Sg9DjHCkgVMemsryDqNHZb1jyPCa6BQGZJBQbh7CQWUFSvfL7W` | [Explorer](https://explorer.solana.com/tx/8snnvAfhyZH5ndeThK7bfRFQzbwanZNNRDK85Sg9DjHCkgVMemsryDqNHZb1jyPCa6BQGZJBQbh7CQWUFSvfL7W?cluster=devnet) |
| **Primary Round Contribution ($2,500 USDC)** | `yPU9kp2XCDY7YKAPRnPXjpRaVcT8c9XxHm59vcBHSjwkZuVjVZwFJ62L8Kaj5cvFd7LSH78FsLg1WMLWiC8YfHj` | [Explorer](https://explorer.solana.com/tx/yPU9kp2XCDY7YKAPRnPXjpRaVcT8c9XxHm59vcBHSjwkZuVjVZwFJ62L8Kaj5cvFd7LSH78FsLg1WMLWiC8YfHj?cluster=devnet) |

---

## 6. Live Frontend & API Endpoints
* **Web Application:** [https://ventrion.space/ventrion/](https://ventrion.space/ventrion/) (or `http://2.28.52.233:3001/ventrion/`)
* **Dividends & Berkshire Hathaway Holding Desk:** `/ventrion/dividends/`
* **Ventures Directory:** `/ventrion/ventures/`
* **Venture Detail (Apex Quantum):** `/ventrion/ventures/J8krWMkHe24H18BmkWtV4WJZEdJcNcZShcP7RwkAHeWn/`
* **REST API Daemon:**
  * `GET /api/ventures/live`
  * `GET /api/ventures/vent/staking-info`
  * `POST /api/ventures/tx/prepare-launch-genesis`
  * `POST /api/ventures/tx/prepare-contribute-round`
  * `POST /api/ventures/tx/prepare-vote-milestone`
  * `POST /api/ventures/tx/prepare-ragequit`
  * `POST /api/ventures/tx/prepare-stake-vent`
  * `POST /api/ventures/tx/prepare-claim-vent-dividends`
  * `POST /api/ventures/tx/prepare-swap-curve` (Continuous Exponential Bonding Curve Swap)
  * `POST /api/ventures/tx/prepare-swap-dlmm` (DLMM with automated Exponential Curve Fallback)

---

## 7. Continuous Exponential Curve Liquidity Engine
* **Invariant:** $K = V_{\text{usdc}} \times V_{\text{shares}}$ (Constant Product with Virtual Reserves)
* **Virtual Liquidity Depth:** $V_{\text{usdc}} = 50,000 \times 10^6$ USDC, $V_{\text{shares}} = V_{\text{usdc}} / P_0$
* **Infinite Liquidity Guarantee:** Eliminates discrete bin depletion (`SWAP_QUOTE_INSUFFICIENT_LIQUIDITY`). Handles retail to whale volume ($1 to $100,000+ USDC).
* **Automated Fallback:** The web client automatically routes through the Exponential Curve whenever discrete DLMM bins lack depth.
* **Devnet Deployer LP Signer:** `2K9r52f1ZxuB1BQ1hhZWFgk1cGPcf7ucdvDHkGgf82TV`

