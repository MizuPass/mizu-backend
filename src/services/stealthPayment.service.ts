import { type Address, type Hex } from 'viem'

/**
 * Stealth Payment Data Structure
 * Stores encrypted payment information indexed by ephemeral public key and view tag
 */
export interface StealthPayment {
  ephPubKey: Hex // Ephemeral public key (32 bytes)
  viewTag: Hex // 1-byte identifier for efficient scanning
  payload: Hex // Encrypted ephemeral private key
  recipient: Address // Original event organizer address
  totalCost: bigint // Total payment amount
  timestamp: number // When the payment was initiated
  blockNumber: bigint // Block number where event was emitted
  transactionHash: Hex // Transaction hash
  eventId: number // Event contract ID (optional, for tracking)
}

/**
 * In-Memory Storage for Stealth Payments
 * In production, this should be replaced with a persistent database (PostgreSQL, MongoDB, etc.)
 */
class StealthPaymentStorage {
  private payments: Map<string, StealthPayment[]> = new Map()
  private paymentsByViewTag: Map<string, StealthPayment[]> = new Map()
  private paymentsByRecipient: Map<Address, StealthPayment[]> = new Map()

  /**
   * Store a new stealth payment
   */
  addPayment(payment: StealthPayment): void {
    // Index by ephPubKey (primary)
    const ephPubKeyStr = payment.ephPubKey
    if (!this.payments.has(ephPubKeyStr)) {
      this.payments.set(ephPubKeyStr, [])
    }
    this.payments.get(ephPubKeyStr)!.push(payment)

    // Index by viewTag for efficient scanning
    const viewTagStr = payment.viewTag
    if (!this.paymentsByViewTag.has(viewTagStr)) {
      this.paymentsByViewTag.set(viewTagStr, [])
    }
    this.paymentsByViewTag.get(viewTagStr)!.push(payment)

    // Index by recipient
    const recipientStr = payment.recipient.toLowerCase() as Address
    if (!this.paymentsByRecipient.has(recipientStr)) {
      this.paymentsByRecipient.set(recipientStr, [])
    }
    this.paymentsByRecipient.get(recipientStr)!.push(payment)

    console.log(`[StealthPayment] Stored payment:`, {
      ephPubKey: payment.ephPubKey.slice(0, 10) + '...',
      viewTag: payment.viewTag,
      recipient: payment.recipient,
      totalCost: payment.totalCost.toString(),
      timestamp: new Date(payment.timestamp).toISOString()
    })
  }

  /**
   * Get payments by view tag (used for efficient scanning)
   * This is how users discover their payments without revealing their identity
   */
  getPaymentsByViewTag(viewTag: Hex): StealthPayment[] {
    return this.paymentsByViewTag.get(viewTag) || []
  }

  /**
   * Get payment by ephemeral public key
   */
  getPaymentByEphPubKey(ephPubKey: Hex): StealthPayment | undefined {
    const payments = this.payments.get(ephPubKey)
    return payments?.[payments.length - 1] // Return most recent
  }

  /**
   * Get all payments for a specific recipient (organizer)
   */
  getPaymentsByRecipient(recipient: Address): StealthPayment[] {
    return this.paymentsByRecipient.get(recipient.toLowerCase() as Address) || []
  }

  /**
   * Get all payments (for admin/debugging)
   */
  getAllPayments(): StealthPayment[] {
    const allPayments: StealthPayment[] = []
    for (const payments of this.payments.values()) {
      allPayments.push(...payments)
    }
    return allPayments.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Get payments within a time range
   */
  getPaymentsByTimeRange(startTime: number, endTime: number): StealthPayment[] {
    return this.getAllPayments().filter(
      payment => payment.timestamp >= startTime && payment.timestamp <= endTime
    )
  }

  /**
   * Get storage statistics
   */
  getStats() {
    return {
      totalPayments: this.getAllPayments().length,
      uniqueEphKeys: this.payments.size,
      uniqueViewTags: this.paymentsByViewTag.size,
      uniqueRecipients: this.paymentsByRecipient.size,
      oldestPayment: this.getAllPayments()[this.getAllPayments().length - 1]?.timestamp,
      newestPayment: this.getAllPayments()[0]?.timestamp
    }
  }

  /**
   * Clear all payments (for testing)
   */
  clear(): void {
    this.payments.clear()
    this.paymentsByViewTag.clear()
    this.paymentsByRecipient.clear()
    console.log('[StealthPayment] Storage cleared')
  }
}

// Singleton instance
export const stealthPaymentStorage = new StealthPaymentStorage()

/**
 * Service for managing stealth payments
 */
export class StealthPaymentService {
  /**
   * Query payments by view tag (most common operation for users)
   * Users scan for their payments using their view tag
   */
  async queryPaymentsByViewTag(viewTag: Hex): Promise<StealthPayment[]> {
    const payments = stealthPaymentStorage.getPaymentsByViewTag(viewTag)
    console.log(`[StealthPayment] Query by viewTag ${viewTag}: found ${payments.length} payments`)
    return payments
  }

  /**
   * Get payment details by ephemeral public key
   */
  async getPaymentByEphPubKey(ephPubKey: Hex): Promise<StealthPayment | null> {
    const payment = stealthPaymentStorage.getPaymentByEphPubKey(ephPubKey)
    return payment || null
  }

  /**
   * Get all payments for a recipient (organizer view)
   */
  async getPaymentsByRecipient(recipient: Address): Promise<StealthPayment[]> {
    return stealthPaymentStorage.getPaymentsByRecipient(recipient)
  }

  /**
   * Get recent payments (admin view)
   */
  async getRecentPayments(limit: number = 50): Promise<StealthPayment[]> {
    const allPayments = stealthPaymentStorage.getAllPayments()
    return allPayments.slice(0, limit)
  }

  /**
   * Get storage statistics
   */
  async getStats() {
    return stealthPaymentStorage.getStats()
  }

  /**
   * Clear all stored payments (for testing)
   */
  async clearAllPayments(): void {
    stealthPaymentStorage.clear()
  }
}
