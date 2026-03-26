import crypto from 'crypto'
import db from '@/lib/db'

/**
 * Order Matching Engine
 *
 * Matches a new order against existing opposing orders in the book.
 * - Buy orders match against sell orders with price <= buy price (lowest first)
 * - Sell orders match against buy orders with price >= sell price (highest first)
 *
 * When a match is found:
 * - A trade record is created in trading_trades
 * - Both orders' remaining_quantity and status are updated
 * - Holdings are updated for both buyer and seller via upsertHolding()
 *
 * Returns: { orderId, status, remaining }
 *
 * NOTE: This engine handles order matching and position updates.
 * You still need to build the API route that calls this, including:
 * - Input validation
 * - Authentication
 * - Balance/share checks before placing an order
 * - Any other business logic you see fit
 *
 * Usage:
 *   import crypto from 'crypto'
 *   import { matchOrder } from '@/lib/matchingEngine'
 *
 *   const result = matchOrder(crypto.randomUUID(), userId, 'NVMT', 'buy', 10, 3.09, 'day')
 *   // result = { orderId: '...', status: 'Pending' | 'Completed' | 'PartiallyFilled', remaining: 7 }
 */

export function upsertHolding(userId: string, symbol: string, deltaShares: number, price: number) {
  const holding = db.prepare('SELECT shares, avg_cost FROM trading_holdings WHERE user_id = ? AND symbol = ?').get(userId, symbol) as
    | { shares: number; avg_cost: number }
    | undefined

  if (!holding) {
    if (deltaShares <= 0) return // nothing to insert for a sell with no position
    db.prepare(
      `INSERT INTO trading_holdings (id, user_id, symbol, shares, avg_cost, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(crypto.randomUUID(), userId, symbol, deltaShares, price)
    return
  }

  const newShares = holding.shares + deltaShares
  if (newShares <= 0) {
    // Position fully closed — remove it
    db.prepare('DELETE FROM trading_holdings WHERE user_id = ? AND symbol = ?').run(userId, symbol)
    return
  }

  // Only recalculate avg_cost when buying (adding shares). Selling keeps the same avg_cost.
  const avgCost = deltaShares > 0
    ? (holding.avg_cost * holding.shares + deltaShares * price) / newShares
    : holding.avg_cost

  db.prepare(
    `UPDATE trading_holdings
     SET shares = ?, avg_cost = ?, updated_at = datetime('now')
     WHERE user_id = ? AND symbol = ?`
  ).run(newShares, avgCost, userId, symbol)
}

export function matchOrder(
  orderId: string,
  userId: string,
  symbol: string,
  side: 'buy' | 'sell',
  quantity: number,
  price: number,
  timeInForce: string,
  goodTilDate: string | null = null
) {
  const now = new Date().toISOString()

  const insertOrder = db.prepare(
    `INSERT INTO trading_orders
     (id, user_id, symbol, side, quantity, remaining_quantity, price, status, time_in_force, good_til_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const updateOrder = db.prepare(
    `UPDATE trading_orders
     SET remaining_quantity = ?, status = ?, updated_at = ?
     WHERE id = ?`
  )
  const insertTrade = db.prepare(
    `INSERT INTO trading_trades (id, buy_order_id, sell_order_id, symbol, quantity, price, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )

  const matchQuery =
    side === 'buy'
      ? `SELECT * FROM trading_orders
         WHERE symbol = ? AND side = 'sell' AND status IN ('New', 'Pending', 'PartiallyFilled')
         AND price <= ?
         ORDER BY price ASC, created_at ASC`
      : `SELECT * FROM trading_orders
         WHERE symbol = ? AND side = 'buy' AND status IN ('New', 'Pending', 'PartiallyFilled')
         AND price >= ?
         ORDER BY price DESC, created_at ASC`

  const matchOrders = db.prepare(matchQuery)

  // Persist the incoming order immediately so buyers/sellers see it in the DB
  insertOrder.run(orderId, userId, symbol, side, quantity, quantity, price, 'New', timeInForce, goodTilDate, now, now)

  return db.transaction(() => {
    let remaining = quantity
    const matches = matchOrders.all(symbol, price) as Array<any>

    // Prepared statements for updating trading balances
    const getBalStmt = db.prepare('SELECT id, cash_balance FROM trading_balances WHERE user_id = ?')
    const insertBalStmt = db.prepare(`INSERT INTO trading_balances (id, user_id, cash_balance, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))`)
    const updateBalStmt = db.prepare(`UPDATE trading_balances SET cash_balance = ?, updated_at = datetime('now') WHERE id = ?`)

    for (const match of matches) {
      if (remaining <= 0) break
      const matchRemaining = Number(match.remaining_quantity)
      if (matchRemaining <= 0) continue

      const fillQty = Math.min(remaining, matchRemaining)
      const tradePrice = Number(match.price)

      const buyOrderId = side === 'buy' ? orderId : match.id
      const sellOrderId = side === 'sell' ? orderId : match.id

      insertTrade.run(crypto.randomUUID(), buyOrderId, sellOrderId, symbol, fillQty, tradePrice, new Date().toISOString())

      const newMatchRemaining = matchRemaining - fillQty
      const matchStatus = newMatchRemaining === 0 ? 'Completed' : 'PartiallyFilled'
      updateOrder.run(newMatchRemaining, matchStatus, new Date().toISOString(), match.id)

      const buyerId = side === 'buy' ? userId : match.user_id
      const sellerId = side === 'sell' ? userId : match.user_id

      upsertHolding(buyerId, symbol, fillQty, tradePrice)
      upsertHolding(sellerId, symbol, -fillQty, tradePrice)

      // Balance updates:
      // - The buyer's cash was already reserved (pre-debited at order price) by the API route.
      //   Here we only handle price improvement: if tradePrice < orderPrice, refund the diff.
      // - The seller receives proceeds from the sale.
      try {
        const tradeNotional = fillQty * tradePrice
        const orderNotional = fillQty * price  // price = the incoming order's price

        // Refund buyer price improvement (0 if market order or trade matched at exact price)
        // For a sell-side incoming order the buyer is `match`, whose order price is match.price
        const buyerOrderPrice = side === 'buy' ? price : Number(match.price)
        const buyerImprovement = Math.max(0, (buyerOrderPrice - tradePrice) * fillQty)
        if (buyerImprovement > 0) {
          const buyerRow = getBalStmt.get(buyerId) as any
          if (buyerRow) updateBalStmt.run(Number(buyerRow.cash_balance) + buyerImprovement, buyerRow.id)
        }

        // Credit seller: they haven't been charged anything — give them the proceeds
        const sellerRow = getBalStmt.get(sellerId) as any
        if (!sellerRow) {
          insertBalStmt.run(crypto.randomUUID(), sellerId, tradeNotional)
        } else {
          updateBalStmt.run(Number(sellerRow.cash_balance) + tradeNotional, sellerRow.id)
        }

        // When a sell order is the incoming order, the engine pre-debits nothing for sells —
        // handle the buyer's side (deduct from buyer, credit seller handled above on next loop turn).
        // For a sell-side incoming order: deduct from the matched buyer (who placed a limit buy earlier,
        // meaning their cash was reserved when THEY placed their order).
        // Nothing extra needed: the matched buyer's cash was already reserved when their buy was placed.
      } catch (e) {
        console.error('Balance update failed during matching:', e)
        throw e
      }

      remaining -= fillQty
    }

    let status = 'Pending'
    if (remaining === 0) {
      status = 'Completed'
    } else if (remaining < quantity) {
      status = 'PartiallyFilled'
    }

    updateOrder.run(remaining, status, new Date().toISOString(), orderId)

    return { orderId, status, remaining }
  })()
}

export function matchExistingOrder(orderId: string) {
  const now = new Date().toISOString()

  const selectOrder = db.prepare('SELECT * FROM trading_orders WHERE id = ?')
  const updateOrder = db.prepare(
    `UPDATE trading_orders
     SET remaining_quantity = ?, status = ?, updated_at = ?
     WHERE id = ?`
  )
  const insertTrade = db.prepare(
    `INSERT INTO trading_trades (id, buy_order_id, sell_order_id, symbol, quantity, price, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )

  return db.transaction(() => {
    // Defensive: trim and ensure we have a string id
    const rawId = String(orderId ?? '').trim()
    let order = selectOrder.get(rawId) as any

    // Fallback: sometimes callers pass a URL or path; try last path segment
    if (!order && rawId.includes('/')) {
      const altId = rawId.split('/').filter(Boolean).pop() as string | undefined
      if (altId) {
        order = selectOrder.get(altId) as any
      }
    }

    if (!order) throw new Error('Order not found')

    const side = order.side as 'buy' | 'sell'
    const symbol = order.symbol
    const quantity = Number(order.quantity)
    // Recompute "filled" from trades so edits to quantity correctly adjust remaining
    const filledRow = db.prepare(
      'SELECT COALESCE(SUM(quantity), 0) as filled FROM trading_trades WHERE buy_order_id = ? OR sell_order_id = ?'
    ).get(order.id, order.id) as { filled: number } | undefined
    const filled = Number(filledRow?.filled ?? 0)

    // New remaining should be based on up-to-date filled amount (protects against PATCH that changed quantity)
    let remaining = Math.max(0, quantity - filled)
    const price = Number(order.price)
    const timeInForce = order.time_in_force

    // If remaining in DB differs from our recomputed remaining, update it before matching
    const dbRemaining = Number(order.remaining_quantity)
    if (dbRemaining !== remaining) {
      const initialStatus = remaining === 0 ? 'Completed' : (remaining < quantity ? 'PartiallyFilled' : 'Pending')
      updateOrder.run(remaining, initialStatus, new Date().toISOString(), order.id)
      // refresh order variable to reflect persisted change if needed later
      order.remaining_quantity = remaining
    }

    // If nothing left to match, return early
    if (remaining <= 0) {
      const finalStatus = 'Completed'
      updateOrder.run(0, finalStatus, new Date().toISOString(), order.id)
      return { orderId: order.id, status: finalStatus, remaining: 0 }
    }

    const matchQuery =
      side === 'buy'
        ? `SELECT * FROM trading_orders
           WHERE symbol = ? AND side = 'sell' AND status IN ('New', 'Pending', 'PartiallyFilled')
           AND price <= ?
           AND id != ?
           ORDER BY price ASC, created_at ASC`
        : `SELECT * FROM trading_orders
           WHERE symbol = ? AND side = 'buy' AND status IN ('New', 'Pending', 'PartiallyFilled')
           AND price >= ?
           AND id != ?
           ORDER BY price DESC, created_at ASC`

    const matchOrders = db.prepare(matchQuery)

    // Prepared statements for updating trading balances
    const getBalStmt = db.prepare('SELECT id, cash_balance FROM trading_balances WHERE user_id = ?')
    const insertBalStmt = db.prepare(`INSERT INTO trading_balances (id, user_id, cash_balance, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))`)
    const updateBalStmt = db.prepare(`UPDATE trading_balances SET cash_balance = ?, updated_at = datetime('now') WHERE id = ?`)

    const matches = matchOrders.all(symbol, price, order.id) as any[]

    for (const match of matches) {
      if (remaining <= 0) break
      const matchRemaining = Number(match.remaining_quantity)
      if (matchRemaining <= 0) continue

      const fillQty = Math.min(remaining, matchRemaining)
      const tradePrice = Number(match.price)

      const buyOrderId = side === 'buy' ? order.id : match.id
      const sellOrderId = side === 'sell' ? order.id : match.id

      insertTrade.run(crypto.randomUUID(), buyOrderId, sellOrderId, symbol, fillQty, tradePrice, new Date().toISOString())

      const newMatchRemaining = matchRemaining - fillQty
      const matchStatus = newMatchRemaining === 0 ? 'Completed' : 'PartiallyFilled'
      db.prepare(
        `UPDATE trading_orders
         SET remaining_quantity = ?, status = ?, updated_at = ?
         WHERE id = ?`
      ).run(newMatchRemaining, matchStatus, new Date().toISOString(), match.id)

      const buyerId = side === 'buy' ? order.user_id : match.user_id
      const sellerId = side === 'sell' ? order.user_id : match.user_id

      upsertHolding(buyerId, symbol, fillQty, tradePrice)
      upsertHolding(sellerId, symbol, -fillQty, tradePrice)

      // Balance settlement — same model as matchOrder:
      // Buyer's cash was pre-reserved when they placed their original order.
      // Refund price improvement if trade filled cheaper than order price.
      // Credit seller with full trade proceeds.
      const tradeNotional = fillQty * tradePrice
      const orderNotional = fillQty * price

      // For a sell-side incoming order the buyer is `match`, whose reserved price is match.price
      const buyerOrderPrice = side === 'buy' ? price : Number(match.price)
      const buyerImprovement = Math.max(0, (buyerOrderPrice - tradePrice) * fillQty)
      if (buyerImprovement > 0) {
        const buyerRow = getBalStmt.get(buyerId) as any
        if (buyerRow) updateBalStmt.run(Number(buyerRow.cash_balance) + buyerImprovement, buyerRow.id)
      }

      const sellerRow = getBalStmt.get(sellerId) as any
      if (!sellerRow) {
        insertBalStmt.run(crypto.randomUUID(), sellerId, tradeNotional)
      } else {
        updateBalStmt.run(Number(sellerRow.cash_balance) + tradeNotional, sellerRow.id)
      }

      remaining -= fillQty
    }

    let status = 'Pending'
    if (remaining === 0) {
      status = 'Completed'
    } else if (remaining < quantity) {
      status = 'PartiallyFilled'
    }

    updateOrder.run(remaining, status, new Date().toISOString(), order.id)

    return { orderId: order.id, status, remaining }
  })()
}
