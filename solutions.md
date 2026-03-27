# Solution — Secondary Marketplace


## What I Built


### 1. Asset Listing Page (`/investing/secondary-trading`)
A full-featured marketplace listing page with:
- **Search** — real-time text filtering across asset name, ticker symbol, and description
- **Category filter** — dropdown to narrow by asset category (tech, real estate, etc.)
- **Sort** — by price (asc/desc) and performance (asc/desc), or default featured order
- **Asset table** — rows showing name, symbol badge, price, daily % change (color-coded), volume, and a "Trade →" CTA
- All filtering is client-side for instant response using `useMemo`


### 2. Asset Detail Page (`/investing/secondary-trading/[id]`)
A rich trading detail page with:
- **Asset header** — logo avatar, name, symbol, category badge, live price + % change, and a quick stats strip (Open, High, Low, Bid, Ask, Volume)
- **Price chart** — SVG line chart with area gradient built from 30-day `dailyHistory` OHLCV data; includes y-axis price labels, x-axis date labels, and axes
- **About section** — company description + financial stats (Market Cap, Revenue, P/E, etc.) rendered dynamically from available fields
- **Order book** — two-column ask/bid table; populated from `templates.orderBook` with `priceMultiplier × basePrice` scaling, with a deterministic synthetic fallback for assets without a template
- **Order placement form** — Buy/Sell toggle, Market/Limit order type, quantity + limit price inputs with inline validation, live estimated notional value
- **Orders & Positions panel** — user's open orders for this asset with Edit / Cancel actions, and their current holdings
- **Trade History panel** — matched fills for this asset showing side (BUY/SELL), quantity, price, notional, and date
- **Edit Order dialog** — update quantity and/or price then force-execute via `/complete`; always marks the order `Completed` in the DB and credits/debits holdings and cash accordingly
- **Cancel confirmation dialog** — "Are you sure?" prompt before firing the cancel API call
- **Snackbar feedback** — success/error/info toasts for all order actions


### 3. Trading API Routes


| Route | Method | Purpose |
|---|---|---|
| `GET /api/trading/assets` | GET | Returns all 5 assets from `secondaryTradingAssets.json` |
| `GET /api/trading/orders` | GET | Returns authenticated user's orders |
| `POST /api/trading/orders` | POST | Places a new order; resolves market price from live order book, validates balance/shares, pre-debits cash for buys, calls `matchOrder()` |
| `PATCH /api/trading/orders/[id]` | PATCH | Updates order quantity/price; adjusts cash reservation delta for buy orders |
| `POST /api/trading/orders/[id]/cancel` | POST | Cancels an open order; refunds reserved cash to buyer |
| `POST /api/trading/orders/[id]/complete` | POST | Re-executes an order via the matching engine; force-completes any unfilled remainder, updating `trading_holdings` and `trading_balances` |
| `GET /api/trading/positions` | GET | Returns user's holdings from `trading_holdings` |
| `GET /api/trading/balance` | GET | Returns user's trading cash balance from `trading_balances` |
| `GET /api/trading/trades` | GET | Returns user's matched trades with buy/sell side context via self-join on `trading_orders` |


**Order flow (buy):**
1. Validate input (quantity, price, required fields)
2. Resolve market price from live order book (`MIN ask` / `MAX bid`), falling back to `currentValue`
3. Check cash balance ≥ `qty × price`; pre-debit the full notional to reserve funds
4. Call `matchOrder()` — inserts order, matches against opposing book, creates trade records, updates `trading_holdings` for both parties, credits seller and refunds buyer price improvement
5. Unmatched remainder sits reserved until cancel or force-complete


**Order flow (sell):**
1. Validate input; check `trading_holdings` has sufficient shares
2. Call `matchOrder()` — matches against existing buy orders, credits seller proceeds, refunds buyer price improvement for any fills
3. Force-complete credits cash proceeds for any unfilled remainder


**Cash accounting invariants:**
- Buyer cash is pre-debited at order placement; only price improvement (fill at lower price) is refunded per-fill
- Seller cash is credited at fill time with `fillQty × tradePrice`; force-complete credits unfilled remainder
- Cancel refunds `remaining_quantity × price` to the buyer
- `PATCH` computes the delta between old and new `remaining × price` and adjusts the reservation accordingly


### 4. Matching Engine (`lib/matchingEngine.ts`)
- `matchOrder()` — inserts a new order and immediately matches it against the opposing book in a SQLite transaction
- `matchExistingOrder()` — re-runs matching on an already-persisted order (used by `/complete`)
- `upsertHolding()` — adds or removes shares from `trading_holdings`; recalculates `avg_cost` only on buys (sells keep existing avg cost for the remaining position)
- Price-time priority: buys match lowest ask first; sells match highest bid first


### 5. Portfolio Integration
- **`CashBalance.tsx`** — fetches `/api/trading/balance` + `/api/banking/balance`, sums them as total available cash, and shows a Trade History section in the Activity panel listing all matched fills with BUY/SELL badge, notional, and date
- **`InvestmentsSection.tsx`** — fetches `/api/trading/positions` to show secondary trading holdings alongside primary marketplace investments
- **`PortfolioSummaryCard.tsx`** — Total Value = marketplace investments + trading positions at avg cost + cash available


### 6. UX Enhancements
- **Loading skeletons** — portfolio summary card, activity rows, orders panel, and positions panel all show `<Skeleton>` placeholders while fetching
- **Error states** — `<Alert>` banners with dismiss on fetch failures; per-field form validation errors with red helper text
- **Snackbar toasts** — success/error/info feedback for order placement, cancellation, edits, and refreshes
- **Form validation** — quantity must be a positive integer; limit price required and positive for limit orders; errors cleared on keystroke
- **Refresh buttons** — portfolio header and orders panel have `<Refresh>` icon buttons to manually re-fetch live data
- **Inline field validation** — `AuthForm` validates email format and password length on blur with real-time error styling
- **Cancel confirmation dialog** — clicking Cancel on an open order shows an "Are you sure?" dialog before firing the API call
- **Edit → force-complete** — Save & Execute always marks the order `Completed` in the UI and DB, with holdings and cash updated in the same request


---


## Key Technical Decisions


**Cash pre-debit on buy placement** — Rather than deducting at fill time, the full `qty × price` notional is reserved immediately when the buy order is placed. This prevents concurrent orders from over-spending without needing a separate "reserved balance" column. Per-fill price improvements are refunded in the same matching transaction.


**Force-complete on Save & Execute** — When a user edits and submits an order, the intent is to execute it immediately regardless of whether a live counterparty exists. The `/complete` route runs the matching engine first (to honour real counterparties if available), then force-completes any unfilled remainder by writing directly to `trading_holdings` and `trading_balances`. This keeps the order book clean and the UI consistent.


**Client-side filtering on listing page** — With only 5 assets, fetching all and filtering in the browser is instant and avoids round-trips. The `GET /api/trading/assets` route is ready to accept query params if the dataset grows.


**Deterministic synthetic order book** — Assets without a `templates.orderBook` get a book seeded by asset ID using a simple FNV-1a hash + xorshift, so the same asset always renders the same book on both server and client (no hydration mismatch).


**Auth via cookies + header fallback** — `getAuthUserId()` checks HttpOnly cookies first (set on login), then falls back to an `Authorization: Bearer` header. Browser `fetch` calls pick up cookies automatically; the Axios client in `lib/api.ts` injects the header for token-based flows.


**Parallel fetching** — `CashBalance.tsx` and the trading detail page both use `Promise.all` to fetch orders, positions, balances, and trades concurrently rather than sequentially.


**SQLite transactions throughout** — Every matching operation and balance update runs inside a `db.transaction()` call so partial writes never leave the database in an inconsistent state.


---


## Trade-offs & What I'd Improve With More Time


- **Real-time order book** — The order book is static per page load. A WebSocket or Server-Sent Events channel would push live updates as orders are placed/matched.
- **Self-trade prevention** — The matching engine currently allows a user's own buy and sell orders to match each other. A production exchange would reject self-trades.
- **Paginated order/trade history** — The Activity panel and Trade History sections are capped at 10–50 rows. Proper pagination or infinite scroll would be needed at scale.
- **Position P&L** — Holdings show value at avg cost. Showing unrealised P&L against the current market price would be more useful for traders.
- **Mobile responsiveness** — The detail page grid stacks correctly on narrow screens, but the order book and price chart could use more breakpoint tuning.
- **Error boundary** — A React error boundary around the trading page would give a graceful fallback if the component tree throws unexpectedly.
- **Optimistic UI** — Orders are added to local state immediately on submit. A follow-up re-fetch after the server responds would ensure the client always shows the canonical server state.


---


## Screen Recording


<!-- Add your Loom / YouTube / Drive link here -->
https://drive.google.com/file/d/1NsxOTDG7_XxkIqqN_68P1xAWMfSIr7KG/view?usp=sharing

