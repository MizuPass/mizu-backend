import { createHash } from 'crypto';
import type { StoredTicketData } from './ticket.service.supabase';

/**
 * Merkle tree for event tickets to enable ZK proofs
 */
export interface EventMerkleTree {
  eventAddress: string;
  merkleRoot: string;
  depth: number;
  leaves: MerkleLeaf[];
  tree: string[][]; // Full tree structure for proof generation
  createdAt: string;
  ticketCount: number;
}

export interface MerkleLeaf {
  index: number;
  hash: string;
  ticketId: string;
  tokenId: string;
  stealthAddress: string;
}

export interface MerkleProof {
  leaf: string;
  leafIndex: number;
  proof: string[];
  pathIndices: number[];
}

/**
 * Hash function for merkle tree (SHA256)
 */
const hashFn = (data: string): string => {
  return createHash('sha256').update(data).digest('hex');
};

/**
 * Create leaf hash from ticket data
 * Format: hash(stealthAddress + tokenId + eventAddress)
 */
export const createTicketLeaf = (ticket: StoredTicketData): string => {
  const data = `${ticket.stealthAddress}${ticket.tokenId}${ticket.eventAddress}`;
  return hashFn(data);
};

/**
 * Build merkle tree from event tickets
 */
export class MerkleTreeBuilder {
  private leaves: string[] = [];
  private tree: string[][] = [];
  private eventAddress: string;

  constructor(eventAddress: string) {
    this.eventAddress = eventAddress.toLowerCase();
  }

  /**
   * Add tickets to the merkle tree
   */
  addTickets(tickets: StoredTicketData[]): void {
    console.log(`[MerkleTree] Building tree for event ${this.eventAddress} with ${tickets.length} tickets`);
    
    // Create leaf hashes for each valid ticket
    this.leaves = tickets
      .filter(ticket => ticket.is_valid)
      .map(createTicketLeaf);

    console.log(`[MerkleTree] Created ${this.leaves.length} leaf hashes`);
  }

  /**
   * Build the complete merkle tree
   */
  build(): EventMerkleTree {
    if (this.leaves.length === 0) {
      throw new Error('No tickets to build merkle tree');
    }

    // Ensure we have a power of 2 number of leaves
    const paddedLeaves = this.padToPowerOfTwo([...this.leaves]);
    console.log(`[MerkleTree] Padded to ${paddedLeaves.length} leaves (power of 2)`);

    // Build tree bottom-up
    this.tree = [paddedLeaves]; // Level 0 (leaves)
    
    let currentLevel = paddedLeaves;
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      
      // Pair up nodes and hash them
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1];
        const parent = hashFn(left + right);
        nextLevel.push(parent);
      }
      
      this.tree.push(nextLevel);
      currentLevel = nextLevel;
    }

    const merkleRoot = currentLevel[0];
    console.log(`[MerkleTree] ✅ Built tree with root: ${merkleRoot}`);

    // Create leaf metadata
    const leafMetadata: MerkleLeaf[] = this.leaves.map((hash, index) => ({
      index,
      hash,
      ticketId: `ticket-${index}`, // We'll need to map this properly
      tokenId: `token-${index}`,   // We'll need to map this properly  
      stealthAddress: `stealth-${index}` // We'll need to map this properly
    }));

    return {
      eventAddress: this.eventAddress,
      merkleRoot,
      depth: this.tree.length - 1,
      leaves: leafMetadata,
      tree: this.tree,
      createdAt: new Date().toISOString(),
      ticketCount: this.leaves.length
    };
  }

  /**
   * Generate merkle proof for a specific ticket
   */
  generateProof(leafIndex: number): MerkleProof {
    if (!this.tree || this.tree.length === 0) {
      throw new Error('Tree not built yet');
    }

    if (leafIndex >= this.leaves.length) {
      throw new Error('Leaf index out of bounds');
    }

    const proof: string[] = [];
    const pathIndices: number[] = [];
    let currentIndex = leafIndex;

    // Go up the tree collecting sibling nodes
    for (let level = 0; level < this.tree.length - 1; level++) {
      const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      const sibling = this.tree[level][siblingIndex];
      
      proof.push(sibling);
      pathIndices.push(currentIndex % 2); // 0 = left, 1 = right
      
      currentIndex = Math.floor(currentIndex / 2);
    }

    return {
      leaf: this.tree[0][leafIndex],
      leafIndex,
      proof,
      pathIndices
    };
  }

  /**
   * Verify a merkle proof
   */
  static verifyProof(proof: MerkleProof, merkleRoot: string): boolean {
    let hash = proof.leaf;
    
    for (let i = 0; i < proof.proof.length; i++) {
      const sibling = proof.proof[i];
      const isLeft = proof.pathIndices[i] === 0;
      
      hash = isLeft ? hashFn(hash + sibling) : hashFn(sibling + hash);
    }
    
    return hash === merkleRoot;
  }

  /**
   * Pad leaves array to next power of 2
   */
  private padToPowerOfTwo(leaves: string[]): string[] {
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(leaves.length)));
    const paddingNeeded = nextPowerOf2 - leaves.length;
    
    // Pad with hash of empty string
    const emptyHash = hashFn('');
    for (let i = 0; i < paddingNeeded; i++) {
      leaves.push(emptyHash);
    }
    
    return leaves;
  }
}

/**
 * Generate merkle tree for a specific event
 */
export const generateEventMerkleTree = async (
  eventAddress: string,
  tickets: StoredTicketData[]
): Promise<EventMerkleTree> => {
  console.log(`[MerkleTree] Generating tree for event: ${eventAddress}`);
  
  const builder = new MerkleTreeBuilder(eventAddress);
  builder.addTickets(tickets);
  
  const tree = builder.build();
  
  console.log(`[MerkleTree] ✅ Generated tree with ${tree.ticketCount} tickets, root: ${tree.merkleRoot}`);
  
  return tree;
};

/**
 * Get merkle proof for a specific ticket in an event
 */
export const getTicketMerkleProof = async (
  eventAddress: string,
  tickets: StoredTicketData[],
  targetTicket: StoredTicketData
): Promise<MerkleProof> => {
  console.log(`[MerkleTree] Generating proof for ticket ${targetTicket.tokenId} in event ${eventAddress}`);
  
  const builder = new MerkleTreeBuilder(eventAddress);
  builder.addTickets(tickets);
  builder.build();
  
  // Find the ticket's leaf index
  const targetLeaf = createTicketLeaf(targetTicket);
  const leafIndex = tickets
    .filter(ticket => ticket.is_valid)
    .findIndex(ticket => createTicketLeaf(ticket) === targetLeaf);
    
  if (leafIndex === -1) {
    throw new Error('Ticket not found in tree');
  }
  
  const proof = builder.generateProof(leafIndex);
  
  console.log(`[MerkleTree] ✅ Generated proof for ticket at index ${leafIndex}`);
  
  return proof;
};