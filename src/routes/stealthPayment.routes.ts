import { Hono } from 'hono'
import { StealthPaymentService } from '../services/stealthPayment.service'
import { eventListenerService } from '../services/eventListener.service'
import type { Address, Hex } from 'viem'

const stealthPayment = new Hono()
const stealthPaymentService = new StealthPaymentService()

/**
 * GET /api/stealth-payments/query/:viewTag
 * Query stealth payments by view tag (1-byte identifier)
 * This is the primary way users discover their payments
 */
stealthPayment.get('/query/:viewTag', async (c) => {
  try {
    const viewTag = c.req.param('viewTag') as Hex

    // Validate viewTag format (should be 0x followed by 2 hex characters)
    if (!viewTag.match(/^0x[0-9a-fA-F]{2}$/)) {
      return c.json({
        error: 'Invalid viewTag format. Expected 0x followed by 2 hex characters (e.g., 0x42)'
      }, 400)
    }

    const payments = await stealthPaymentService.queryPaymentsByViewTag(viewTag)

    return c.json({
      success: true,
      viewTag,
      count: payments.length,
      payments: payments.map(p => ({
        ephPubKey: p.ephPubKey,
        payload: p.payload,
        viewTag: p.viewTag,
        recipient: p.recipient,
        totalCost: p.totalCost.toString(),
        timestamp: p.timestamp,
        blockNumber: p.blockNumber.toString(),
        transactionHash: p.transactionHash,
        eventId: p.eventId
      }))
    })
  } catch (error) {
    console.error('[API] Error querying by viewTag:', error)
    return c.json({
      error: 'Failed to query payments by viewTag',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

/**
 * GET /api/stealth-payments/eph/:ephPubKey
 * Get payment details by ephemeral public key
 */
stealthPayment.get('/eph/:ephPubKey', async (c) => {
  try {
    const ephPubKey = c.req.param('ephPubKey') as Hex

    // Validate ephPubKey format (should be 0x followed by 64 hex characters)
    if (!ephPubKey.match(/^0x[0-9a-fA-F]{64}$/)) {
      return c.json({
        error: 'Invalid ephPubKey format. Expected 0x followed by 64 hex characters (32 bytes)'
      }, 400)
    }

    const payment = await stealthPaymentService.getPaymentByEphPubKey(ephPubKey)

    if (!payment) {
      return c.json({
        success: false,
        message: 'Payment not found'
      }, 404)
    }

    return c.json({
      success: true,
      payment: {
        ephPubKey: payment.ephPubKey,
        payload: payment.payload,
        viewTag: payment.viewTag,
        recipient: payment.recipient,
        totalCost: payment.totalCost.toString(),
        timestamp: payment.timestamp,
        blockNumber: payment.blockNumber.toString(),
        transactionHash: payment.transactionHash,
        eventId: payment.eventId
      }
    })
  } catch (error) {
    console.error('[API] Error querying by ephPubKey:', error)
    return c.json({
      error: 'Failed to query payment by ephPubKey',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

/**
 * GET /api/stealth-payments/recipient/:address
 * Get all payments for a specific recipient (organizer)
 */
stealthPayment.get('/recipient/:address', async (c) => {
  try {
    const address = c.req.param('address') as Address

    // Validate address format
    if (!address.match(/^0x[0-9a-fA-F]{40}$/)) {
      return c.json({
        error: 'Invalid Ethereum address format'
      }, 400)
    }

    const payments = await stealthPaymentService.getPaymentsByRecipient(address)

    return c.json({
      success: true,
      recipient: address,
      count: payments.length,
      payments: payments.map(p => ({
        ephPubKey: p.ephPubKey,
        payload: p.payload,
        viewTag: p.viewTag,
        totalCost: p.totalCost.toString(),
        timestamp: p.timestamp,
        blockNumber: p.blockNumber.toString(),
        transactionHash: p.transactionHash,
        eventId: p.eventId
      }))
    })
  } catch (error) {
    console.error('[API] Error querying by recipient:', error)
    return c.json({
      error: 'Failed to query payments by recipient',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

/**
 * GET /api/stealth-payments/recent
 * Get recent stealth payments (admin view)
 */
stealthPayment.get('/recent', async (c) => {
  try {
    const limitParam = c.req.query('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 50

    if (isNaN(limit) || limit < 1 || limit > 1000) {
      return c.json({
        error: 'Invalid limit. Must be between 1 and 1000'
      }, 400)
    }

    const payments = await stealthPaymentService.getRecentPayments(limit)

    return c.json({
      success: true,
      count: payments.length,
      limit,
      payments: payments.map(p => ({
        ephPubKey: p.ephPubKey,
        payload: p.payload,
        viewTag: p.viewTag,
        recipient: p.recipient,
        totalCost: p.totalCost.toString(),
        timestamp: p.timestamp,
        blockNumber: p.blockNumber.toString(),
        transactionHash: p.transactionHash,
        eventId: p.eventId
      }))
    })
  } catch (error) {
    console.error('[API] Error querying recent payments:', error)
    return c.json({
      error: 'Failed to query recent payments',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

/**
 * GET /api/stealth-payments/stats
 * Get storage statistics
 */
stealthPayment.get('/stats', async (c) => {
  try {
    const stats = await stealthPaymentService.getStats()
    const listenerStatus = eventListenerService.getStatus()

    return c.json({
      success: true,
      storage: stats,
      listener: listenerStatus
    })
  } catch (error) {
    console.error('[API] Error getting stats:', error)
    return c.json({
      error: 'Failed to get statistics',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

/**
 * POST /api/stealth-payments/listener/start
 * Start the blockchain event listener
 */
stealthPayment.post('/listener/start', async (c) => {
  try {
    const body = await c.req.json()
    const fromBlock = body.fromBlock ? BigInt(body.fromBlock) : undefined

    await eventListenerService.startListening(fromBlock)

    return c.json({
      success: true,
      message: 'Event listener started',
      status: eventListenerService.getStatus()
    })
  } catch (error) {
    console.error('[API] Error starting listener:', error)
    return c.json({
      error: 'Failed to start event listener',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

/**
 * POST /api/stealth-payments/listener/stop
 * Stop the blockchain event listener
 */
stealthPayment.post('/listener/stop', async (c) => {
  try {
    eventListenerService.stopListening()

    return c.json({
      success: true,
      message: 'Event listener stopped'
    })
  } catch (error) {
    console.error('[API] Error stopping listener:', error)
    return c.json({
      error: 'Failed to stop event listener',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

/**
 * GET /api/stealth-payments/listener/status
 * Get event listener status
 */
stealthPayment.get('/listener/status', async (c) => {
  try {
    const status = eventListenerService.getStatus()

    return c.json({
      success: true,
      ...status
    })
  } catch (error) {
    console.error('[API] Error getting listener status:', error)
    return c.json({
      error: 'Failed to get listener status',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

/**
 * POST /api/stealth-payments/scan-historical
 * Scan for historical events (admin function)
 */
stealthPayment.post('/scan-historical', async (c) => {
  try {
    const body = await c.req.json()
    const fromBlock = BigInt(body.fromBlock)
    const toBlock = body.toBlock ? BigInt(body.toBlock) : undefined

    const count = await eventListenerService.scanHistoricalEvents(fromBlock, toBlock)

    return c.json({
      success: true,
      message: `Scanned and indexed ${count} historical events`,
      eventsIndexed: count
    })
  } catch (error) {
    console.error('[API] Error scanning historical events:', error)
    return c.json({
      error: 'Failed to scan historical events',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

export default stealthPayment
