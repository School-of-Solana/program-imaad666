# Project Description

**Deployed Frontend URL:** https://sos-find-are-vercel.vercel.app/

**Solana Program ID:** `JAVuBXeBZqXNtS73azhBDAoYaaAFfo4gWXoZe2e7Jf8H`

## Project Overview

### Description
Find[Are] is a decentralized lost-and-found application built on Solana. The dApp enables users to report lost items with SOL rewards and report found items that can be claimed by their owners. The platform uses an admin verification system to ensure legitimate matches between lost items and found reports, as well as between found items and ownership claims. All transactions are secured on-chain, with SOL escrowed for rewards and deposits until admin verification completes the process.

### Key Features
- **Lost Item Posts**: Users can create posts for lost items, escrowing SOL as a reward for the finder
- **Found Item Reports**: Finders can submit reports for lost items with evidence, triggering admin verification
- **Found Item Listings**: Users can post items they've found, allowing owners to claim them
- **Ownership Claims**: Users can claim found items by submitting a deposit and verification notes
- **Admin Verification**: Admins can approve or reject found reports and ownership claims
- **SOL Escrow System**: Rewards and deposits are securely held until verification completes
- **Private Photo Storage**: Lost item photos are stored privately (visible only to admins) for verification

### How to Use the dApp
1. **Connect Wallet** - Connect your Solana wallet (Phantom, Solflare, etc.)
2. **Report Lost Item**:
   - Navigate to "Lost Items" tab
   - Click "Report Lost Item"
   - Fill in title, description, attributes, photo reference (IPFS URI), and reward amount (minimum 0.1 SOL)
   - Submit transaction to create the post
3. **Submit Found Report**:
   - Browse lost items in the feed
   - Click "Found It!" on a matching item
   - Provide evidence URI (IPFS link)
   - Submit report (waits for admin verification)
4. **Report Found Item**:
   - Navigate to "Found Items" tab
   - Click "Report Found Item"
   - Fill in item details and photo reference
   - Submit to create listing
5. **Claim Found Item**:
   - Browse found items
   - Click "Claim This Item" on a matching item
   - Provide claim notes and deposit (minimum 0.01 SOL)
   - Submit claim (waits for admin verification)
6. **Admin Actions** (Admin only):
   - Approve/Reject found reports on lost posts
   - Approve/Reject ownership claims on found listings
   - View private photos for verification

## Program Architecture
Find[Are] uses a comprehensive architecture with multiple account types and instructions to handle the complete lost-and-found workflow. The program leverages PDAs extensively to create deterministic addresses for all user-generated content and verification tickets.

### PDA Usage
The program uses Program Derived Addresses to create deterministic accounts for configuration, posts, reports, and claims.

**PDAs Used:**
- **AppConfig PDA**: Derived from seeds `["config"]` - stores global app configuration including admin address and post counters
- **LostPost PDA**: Derived from seeds `["lost-post", poster_pubkey, post_id]` - creates unique lost post accounts for each user's posts
- **FoundPost PDA**: Derived from seeds `["found-post", finder_pubkey, post_id]` - creates unique found listing accounts
- **FoundReport PDA**: Derived from seeds `["found-report", lost_post_pubkey, finder_pubkey]` - creates verification tickets for found reports
- **ClaimTicket PDA**: Derived from seeds `["claim-ticket", found_post_pubkey, claimer_pubkey]` - creates verification tickets for ownership claims

### Program Instructions
**Instructions Implemented:**
- **initialize_app**: Initializes the application with an admin address and sets up the config PDA
- **create_lost_post**: Creates a lost item post, escrowing SOL as reward (minimum 0.1 SOL)
- **submit_found_report**: Submits a found report for a lost post with evidence URI
- **approve_found_report**: Admin-only instruction to approve a found report, transferring reward to finder
- **reject_found_report**: Admin-only instruction to reject a found report, reopening the lost post
- **close_lost_post**: Allows poster to close a lost post when no reward is outstanding
- **create_found_listing**: Creates a found item listing
- **claim_found_listing**: Submits an ownership claim for a found item with deposit (minimum 0.01 SOL)
- **approve_claim**: Admin-only instruction to approve an ownership claim, transferring deposit to finder
- **reject_claim**: Admin-only instruction to reject an ownership claim, refunding deposit to claimant

### Account Structure
```rust
#[account]
pub struct AppConfig {
    pub admin: Pubkey,           // Admin wallet address
    pub lost_post_count: u64,    // Counter for lost posts
    pub found_post_count: u64,   // Counter for found posts
    pub bump: u8,                // PDA bump seed
}

#[account]
pub struct LostPost {
    pub config: Pubkey,          // Reference to AppConfig
    pub owner: Pubkey,           // Wallet that created the post
    pub finder: Pubkey,          // Wallet that found the item (set after approval)
    pub post_id: u64,            // Unique post identifier
    pub reward_lamports: u64,     // SOL reward amount (escrowed)
    pub status: PostStatus,      // Current status (Open, AwaitingAdminReview, AwaitingPickup, Closed)
    pub created_at: i64,         // Unix timestamp
    pub updated_at: i64,         // Last update timestamp
    pub title: String,           // Post title (max 64 chars)
    pub description: String,     // Post description (max 512 chars)
    pub attributes: String,       // Item attributes (max 256 chars)
    pub photo_ref: String,       // IPFS URI for photo (max 128 chars, admin-only)
    pub bump: u8,                // PDA bump seed
}

#[account]
pub struct FoundPost {
    pub config: Pubkey,          // Reference to AppConfig
    pub finder: Pubkey,          // Wallet that found the item
    pub post_id: u64,            // Unique post identifier
    pub title: String,           // Listing title (max 64 chars)
    pub description: String,     // Listing description (max 512 chars)
    pub attributes: String,      // Item attributes (max 256 chars)
    pub photo_ref: String,       // IPFS URI for photo (max 128 chars)
    pub status: ClaimStatus,     // Current status (Open, AwaitingAdminReview, Closed)
    pub created_at: i64,         // Unix timestamp
    pub updated_at: i64,         // Last update timestamp
    pub active_claim: Pubkey,     // Currently active claim ticket (if any)
    pub bump: u8,                // PDA bump seed
}

#[account]
pub struct FoundReport {
    pub lost_post: Pubkey,       // Reference to LostPost
    pub finder: Pubkey,          // Wallet that submitted the report
    pub evidence_uri: String,    // IPFS URI for evidence (max 128 chars)
    pub status: VerificationStatus, // Status (Submitted, Approved, Rejected)
    pub created_at: i64,         // Unix timestamp
    pub bump: u8,                // PDA bump seed
}

#[account]
pub struct ClaimTicket {
    pub found_post: Pubkey,      // Reference to FoundPost
    pub claimer: Pubkey,        // Wallet claiming ownership
    pub notes: String,          // Claim notes (max 512 chars)
    pub status: VerificationStatus, // Status (Submitted, Approved, Rejected)
    pub deposit_lamports: u64,   // SOL deposit amount (escrowed)
    pub created_at: i64,         // Unix timestamp
    pub bump: u8,                // PDA bump seed
}
```

## Testing

### Test Coverage
Comprehensive test suite covering all instructions with both successful operations and error conditions to ensure program security, proper SOL transfers, and state management.

**Happy Path Tests:**
- **Lost Post Lifecycle**: Successfully creates lost post, submits found report, admin approves/rejects report, transfers reward, and closes post
- **Found Listing Claims**: Successfully creates found listing, submits ownership claim, admin approves/rejects claim, transfers deposit, and updates status
- **Reward Transfer**: Verifies SOL is correctly transferred to finder upon approval
- **Deposit Refund**: Verifies SOL is correctly refunded to claimant upon rejection

**Unhappy Path Tests:**
- **Reward Too Small**: Fails when creating lost post with reward below minimum (0.1 SOL)
- **Deposit Too Small**: Fails when claiming found item with deposit below minimum (0.01 SOL)
- **Unauthorized Admin Actions**: Fails when non-admin tries to approve/reject reports or claims
- **Lost Post Not Open**: Fails when submitting report to post that's not in Open status
- **Claim Not Allowed**: Fails when claiming found item that's not in Open status
- **Report Already Processed**: Fails when trying to approve/reject an already processed report
- **Claim Already Processed**: Fails when trying to approve/reject an already processed claim
- **Outstanding Reward**: Fails when trying to close lost post with outstanding reward
- **Double Submission**: Fails when submitting multiple reports for same lost post
- **Double Claim**: Fails when claiming already claimed found listing
- **Double Approval**: Fails when trying to approve/reject the same report/claim twice

### Running Tests
```bash
cd anchor_project
npm install
anchor test
```

### Additional Notes for Evaluators

**Key Implementation Details:**
- All SOL transfers use Anchor's secure transfer helpers to prevent reentrancy and ensure atomicity
- Account discriminators are used to filter program accounts efficiently
- Status enums (PostStatus, ClaimStatus, VerificationStatus) ensure type-safe state management
- Text length validation prevents account size issues and enforces reasonable limits
- PDA derivation ensures deterministic addresses and prevents address collisions

**Security Considerations:**
- Admin verification is enforced at the program level, not just UI
- SOL escrow ensures funds are only released after admin approval
- Account ownership is validated for all state-changing operations
- Status transitions are enforced to prevent invalid state changes

**Frontend Architecture:**
- React Query for efficient data fetching and caching
- Real-time updates via query invalidation after mutations
- Type-safe client generated from Anchor IDL using Codama
- Responsive UI with Tailwind CSS and shadcn/ui components

**Deployment Notes:**
- Program deployed to Solana devnet (program ID: JAVuBXeBZqXNtS73azhBDAoYaaAFfo4gWXoZe2e7Jf8H)
- Frontend ready for Vercel deployment with environment variable configuration
- Requires ANCHOR_PROVIDER_URL and ANCHOR_WALLET environment variables
