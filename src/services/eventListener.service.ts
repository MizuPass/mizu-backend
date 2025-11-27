import { createPublicClient, http, type Address, type Hex, type Log, parseAbiItem } from 'viem'
import { mantleSepolia } from '../config/KaiganChain'
import { EVENT_REGISTRY_ADDRESS } from '../config/Contracts'
import { stealthPaymentStorage, type StealthPayment } from './stealthPayment.service'

/**
 * Event Listener Service
 * Listens to blockchain events and indexes stealth payment data
 */
export class EventListenerService {
  private client = createPublicClient({
    chain: mantleSepolia,
    transport: http()
  })

  private isListening = false
  private lastProcessedBlock: bigint = 0n
  private pollingInterval: NodeJS.Timeout | null = null

  /**
   * PaymentPending Event Structure (from EventContract.sol)
   *
   * event PaymentPending(
   *     bytes32 indexed ephPubKey,
   *     bytes payload,
   *     bytes1 viewTag,
   *     uint256 totalCost
   * );
   */
  private readonly PAYMENT_PENDING_EVENT = parseAbiItem(
    'event PaymentPending(bytes32 indexed ephPubKey, bytes payload, bytes1 viewTag, uint256 totalCost)'
  )

  /**
   * StealthAddressFunded Event Structure (from EventContract.sol)
   *
   * event StealthAddressFunded(
   *     bytes32 indexed ephPubKey,
   *     address indexed buyer,
   *     uint256 gasAmount
   * );
   */
  private readonly STEALTH_ADDRESS_FUNDED_EVENT = parseAbiItem(
    'event StealthAddressFunded(bytes32 indexed ephPubKey, address indexed buyer, uint256 gasAmount)'
  )

  /**
   * Start listening to blockchain events
   */
  async startListening(fromBlock?: bigint): Promise<void> {
    if (this.isListening) {
      console.log('[EventListener] Already listening')
      return
    }

    try {
      // Get current block number
      const currentBlock = await this.client.getBlockNumber()
      this.lastProcessedBlock = fromBlock || currentBlock

      console.log('[EventListener] Starting event listener...')
      console.log(`[EventListener] Chain: ${mantleSepolia.name} (ID: ${mantleSepolia.id})`)
      console.log(`[EventListener] Starting from block: ${this.lastProcessedBlock}`)
      console.log(`[EventListener] Current block: ${currentBlock}`)

      this.isListening = true

      // Start polling for new events
      this.pollingInterval = setInterval(async () => {
        await this.pollForEvents()
      }, 6000) // Poll every 6 seconds (Mantle Sepolia block time ~2-3s)

      // Do initial poll
      await this.pollForEvents()

      console.log('[EventListener] Event listener started successfully')
    } catch (error) {
      console.error('[EventListener] Failed to start listener:', error)
      this.isListening = false
      throw error
    }
  }

  /**
   * Stop listening to blockchain events
   */
  stopListening(): void {
    if (!this.isListening) {
      console.log('[EventListener] Not currently listening')
      return
    }

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }

    this.isListening = false
    console.log('[EventListener] Event listener stopped')
  }

  /**
   * Poll for new events
   */
  private async pollForEvents(): Promise<void> {
    try {
      const currentBlock = await this.client.getBlockNumber()

      // No new blocks
      if (currentBlock <= this.lastProcessedBlock) {
        return
      }

      console.log(`[EventListener] Checking blocks ${this.lastProcessedBlock + 1n} to ${currentBlock}`)

      // Get PaymentPending events
      const paymentPendingLogs = await this.client.getLogs({
        event: this.PAYMENT_PENDING_EVENT,
        fromBlock: this.lastProcessedBlock + 1n,
        toBlock: currentBlock
      })

      // Process PaymentPending events
      for (const log of paymentPendingLogs) {
        await this.processPaymentPendingEvent(log)
      }

      // Get StealthAddressFunded events (optional, for additional context)
      const fundedLogs = await this.client.getLogs({
        event: this.STEALTH_ADDRESS_FUNDED_EVENT,
        fromBlock: this.lastProcessedBlock + 1n,
        toBlock: currentBlock
      })

      if (paymentPendingLogs.length > 0 || fundedLogs.length > 0) {
        console.log(`[EventListener] Found ${paymentPendingLogs.length} PaymentPending and ${fundedLogs.length} Funded events`)
      }

      this.lastProcessedBlock = currentBlock
    } catch (error) {
      console.error('[EventListener] Error polling for events:', error)
    }
  }

  /**
   * Process a PaymentPending event
   */
  private async processPaymentPendingEvent(log: Log): Promise<void> {
    try {
      const { blockNumber, transactionHash } = log
      const args = (log as any).args

      if (!args || !blockNumber || !transactionHash) {
        console.error('[EventListener] Invalid PaymentPending event log')
        return
      }

      const { ephPubKey, payload, viewTag, totalCost } = args as {
        ephPubKey: Hex
        payload: Hex
        viewTag: Hex
        totalCost: bigint
      }

      // Get block timestamp
      const block = await this.client.getBlock({ blockNumber })
      const timestamp = Number(block.timestamp) * 1000 // Convert to milliseconds

      // Get transaction details to find recipient
      const tx = await this.client.getTransaction({ hash: transactionHash })
      const contractAddress = tx.to || ('0x' as Address)

      // Try to determine the recipient (event organizer)
      // In a real implementation, you would decode the transaction data or read from contract
      const recipient = tx.from // Placeholder - should be event organizer address

      const payment: StealthPayment = {
        ephPubKey,
        viewTag,
        payload,
        recipient,
        totalCost,
        timestamp,
        blockNumber,
        transactionHash,
        eventId: 0 // Would need to parse from transaction data
      }

      // Store the payment
      stealthPaymentStorage.addPayment(payment)

      console.log('[EventListener] ✅ Indexed PaymentPending event:', {
        ephPubKey: ephPubKey.slice(0, 10) + '...',
        viewTag,
        totalCost: totalCost.toString(),
        block: blockNumber.toString(),
        tx: transactionHash.slice(0, 10) + '...'
      })
    } catch (error) {
      console.error('[EventListener] Error processing PaymentPending event:', error)
    }
  }

  /**
   * Get listener status
   */
  getStatus() {
    return {
      isListening: this.isListening,
      lastProcessedBlock: this.lastProcessedBlock.toString(),
      chain: {
        name: mantleSepolia.name,
        id: mantleSepolia.id
      },
      eventRegistry: EVENT_REGISTRY_ADDRESS
    }
  }

  /**
   * Manually trigger a scan for historical events
   * Useful for initial setup or recovery
   */
  async scanHistoricalEvents(fromBlock: bigint, toBlock?: bigint): Promise<number> {
    console.log('[EventListener] Starting historical event scan...')

    const currentBlock = await this.client.getBlockNumber()
    const scanToBlock = toBlock || currentBlock

    console.log(`[EventListener] Scanning from block ${fromBlock} to ${scanToBlock}`)

    const paymentPendingLogs = await this.client.getLogs({
      event: this.PAYMENT_PENDING_EVENT,
      fromBlock,
      toBlock: scanToBlock
    })

    console.log(`[EventListener] Found ${paymentPendingLogs.length} historical PaymentPending events`)

    for (const log of paymentPendingLogs) {
      await this.processPaymentPendingEvent(log)
    }

    console.log('[EventListener] Historical scan completed')
    return paymentPendingLogs.length
  }
}

// Singleton instance
export const eventListenerService = new EventListenerService()
