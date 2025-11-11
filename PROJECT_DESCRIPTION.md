# Project Description

**Deployed Frontend URL:** [Deploy using instructions in frontend/DEPLOYMENT.md]

**Solana Program ID:** `13AyfsUmh9iow5qF83SV5hv9imBdAFFgvSbjdBQUceuk`

## Project Overview

### Description
A fully decentralized task management application built on Solana. Users can create, update, toggle completion status, and delete tasks directly on the blockchain. Each user has their own isolated task list managed through Program Derived Addresses (PDAs), ensuring data ownership and security. The application demonstrates core Solana program development concepts including account management, PDAs, and state mutations.

### Key Features
- **User Account Initialization**: Create a personal account to manage your tasks
- **Create Tasks**: Add new tasks with title, description, and priority levels (Low, Medium, High, Urgent)
- **Toggle Completion**: Mark tasks as complete or incomplete with a single click
- **Update Tasks**: Modify task details including title, description, and priority
- **Delete Tasks**: Remove tasks and reclaim rent
- **Filter Tasks**: View all tasks, only active tasks, or only completed tasks
- **Task Statistics**: Real-time display of total, completed, and active task counts
- **Priority System**: Organize tasks by urgency with color-coded priority badges

### How to Use the dApp

1. **Connect Wallet**
   - Click "Select Wallet" button in the header
   - Choose your wallet (Phantom, Solflare, etc.)
   - Approve the connection
   - Ensure your wallet is set to **Devnet**

2. **Initialize Your Account**
   - On first visit, click "Initialize Account"
   - Approve the transaction in your wallet
   - This creates your personal user account on-chain

3. **Create a Task**
   - Enter a task title (required, max 100 characters)
   - Add an optional description (max 500 characters)
   - Select a priority level
   - Click "Create Task" and approve the transaction

4. **Manage Tasks**
   - **Toggle Completion**: Click the checkbox next to any task
   - **Delete Task**: Click the "Delete" button on any task
   - **Filter View**: Use All/Active/Completed buttons to filter your task list

5. **View Statistics**
   - See your total tasks created
   - Track how many tasks you've completed
   - Monitor active (incomplete) tasks

## Program Architecture

The Task Manager program is built using the Anchor framework and implements a clean, efficient architecture with two main account types and five core instructions.

### PDA Usage

Program Derived Addresses are used to create deterministic, user-specific accounts without requiring additional keypairs.

**PDAs Used:**

1. **User Account PDA**
   - **Seeds**: `["user", user_wallet_pubkey]`
   - **Purpose**: Stores user-level metadata including task count and completed count
   - **Benefits**: Each user gets a unique account derived from their wallet address

2. **Task PDA**
   - **Seeds**: `["task", user_wallet_pubkey, task_id_bytes]`
   - **Purpose**: Stores individual task data
   - **Benefits**: Each task has a deterministic address based on user and task ID, enabling easy lookup and preventing conflicts

### Program Instructions

**Instructions Implemented:**

1. **initialize_user**
   - Creates a new user account for first-time users
   - Initializes task_count and completed_count to 0
   - Stores the user's public key as the owner

2. **create_task**
   - Creates a new task account with user-provided data
   - Validates title length (1-100 characters) and description length (≤500 characters)
   - Increments the user's task_count
   - Stores task metadata including priority, creation timestamp, and task ID

3. **toggle_task**
   - Flips the completed status of a task
   - Updates the user's completed_count accordingly
   - Enforces ownership verification to prevent unauthorized access

4. **update_task**
   - Allows modification of task title, description, and/or priority
   - Supports partial updates (can update just one field)
   - Validates new values against constraints
   - Maintains ownership security

5. **delete_task**
   - Removes a task account from the blockchain
   - Returns rent to the user
   - Updates completed_count if the task was marked as complete
   - Closes the account using Anchor's `close` constraint

### Account Structure

```rust
#[account]
#[derive(InitSpace)]
pub struct UserAccount {
    pub owner: Pubkey,           // 32 bytes - Wallet that owns this account
    pub task_count: u64,         // 8 bytes - Total tasks created (never decreases)
    pub completed_count: u64,    // 8 bytes - Number of completed tasks
    pub bump: u8,                // 1 byte - PDA bump seed
}
// Total: 49 bytes + 8 byte discriminator = 57 bytes

#[account]
#[derive(InitSpace)]
pub struct Task {
    pub owner: Pubkey,           // 32 bytes - Wallet that owns this task
    #[max_len(100)]
    pub title: String,           // 4 + 100 bytes - Task title
    #[max_len(500)]
    pub description: String,     // 4 + 500 bytes - Task description
    pub priority: Priority,      // 1 byte - Priority enum
    pub completed: bool,         // 1 byte - Completion status
    pub created_at: i64,         // 8 bytes - Unix timestamp
    pub task_id: u64,            // 8 bytes - Sequential task ID
    pub bump: u8,                // 1 byte - PDA bump seed
}
// Total: 659 bytes + 8 byte discriminator = 667 bytes

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum Priority {
    Low,      // Green badge in UI
    Medium,   // Yellow badge in UI
    High,     // Orange badge in UI
    Urgent,   // Red badge in UI
}
```

## Testing

### Test Coverage

Comprehensive test suite with 22 tests covering all instructions and edge cases.

**Happy Path Tests (8 tests):**
- **Initialize User Account**: Successfully creates user account with correct initial values
- **Create Task**: Creates task with all fields populated correctly
- **Create Second Task**: Verifies task_count increments properly
- **Toggle Task to Completed**: Marks task as complete and updates completed_count
- **Toggle Task to Incomplete**: Marks task as incomplete and decrements completed_count
- **Update Task**: Modifies all task fields successfully
- **Update Task Partial**: Updates only specified fields, leaving others unchanged
- **Delete Task**: Removes task and reclaims rent

**Unhappy Path Tests (10 tests):**
- **Duplicate Initialization**: Fails when trying to initialize existing user account
- **Empty Title**: Rejects task creation with empty title
- **Title Too Long**: Rejects task creation with title > 100 characters
- **Description Too Long**: Rejects task creation with description > 500 characters
- **Unauthorized Toggle**: Prevents non-owner from toggling task
- **Unauthorized Update**: Prevents non-owner from updating task
- **Unauthorized Delete**: Prevents non-owner from deleting task
- **Non-existent Task**: Fails gracefully when operating on deleted/non-existent task
- **Invalid Update Title**: Rejects update with invalid title length
- **Invalid Update Description**: Rejects update with invalid description length

**Edge Cases (4 tests):**
- **All Priority Levels**: Creates tasks with each priority level (Low, Medium, High, Urgent)
- **Maximum Title Length**: Successfully creates task with exactly 100 character title
- **Maximum Description Length**: Successfully creates task with exactly 500 character description
- **Empty Description**: Allows task creation with empty description (valid use case)

### Running Tests

```bash
cd anchor_project/task_manager
anchor test
```

All 22 tests pass successfully, demonstrating:
- Correct account initialization and state management
- Proper PDA derivation and account constraints
- Effective error handling and validation
- Security through ownership verification
- Edge case handling

## Frontend Architecture

### Technology Stack
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS for responsive, modern UI
- **Wallet Integration**: Solana Wallet Adapter (supports Phantom, Solflare, and more)
- **Blockchain Interaction**: @coral-xyz/anchor for type-safe program calls
- **State Management**: React hooks (useState, useEffect)

### Key Components

1. **WalletContextProvider**: Wraps the app with wallet adapter functionality
2. **TaskManager**: Main component handling all program interactions
3. **Responsive UI**: Mobile-friendly design with Tailwind CSS
4. **Real-time Updates**: Fetches fresh data after each transaction

### Features
- Auto-connects to Devnet
- Displays connection status
- Shows transaction confirmations
- Color-coded priority system
- Task filtering (All/Active/Completed)
- Loading states during transactions
- Error handling with user-friendly messages

## Deployment

### Program Deployment
- **Network**: Solana Devnet
- **Program ID**: `13AyfsUmh9iow5qF83SV5hv9imBdAFFgvSbjdBQUceuk`
- **Deployment Command**: `anchor deploy`
- **Status**: ✅ Successfully deployed

### Frontend Deployment
- **Platform**: Vercel (recommended)
- **Instructions**: See `frontend/DEPLOYMENT.md`
- **Build Command**: `npm run build`
- **Framework**: Next.js (auto-detected by Vercel)

## Additional Notes for Evaluators

### Development Journey
This project represents a complete full-stack Solana dApp implementation. Key learning points:

1. **PDA Architecture**: Understanding how to structure PDAs for efficient account lookup and security
2. **Account Constraints**: Using Anchor's constraint system (`has_one`, `seeds`, `bump`, `close`)
3. **Error Handling**: Implementing custom errors and proper validation
4. **Testing Strategy**: Writing comprehensive tests that cover both success and failure cases
5. **Frontend Integration**: Connecting a modern web app to Solana programs with proper type safety

### Design Decisions

**Why Task Manager?**
- Practical use case that everyone understands
- Demonstrates CRUD operations on-chain
- Shows state management across multiple accounts
- Illustrates the cost-benefit of blockchain storage

**Why PDAs?**
- No need for users to manage multiple keypairs
- Deterministic addresses enable easy account lookup
- Secure by design (only program can sign for PDA)

**Why Anchor?**
- Type safety and better developer experience
- Built-in security checks and constraints
- Automatic IDL generation for frontend integration
- Cleaner, more maintainable code

### Potential Improvements
If this were a production app, I would add:
- Task categories/tags
- Due dates and reminders
- Sharing/collaboration features
- Task history and audit log
- Pagination for users with many tasks
- Bulk operations (delete multiple tasks)
- Search functionality
- Export tasks to CSV/JSON

### Security Considerations
- All instructions verify ownership using `has_one` constraints
- Input validation on title and description lengths
- PDA derivation prevents account collision
- Proper error handling prevents undefined behavior
- Tests verify unauthorized access is blocked

### Performance Notes
- Task lookup is O(n) where n is task_count
- For production, consider using a more efficient indexing strategy
- Current implementation prioritizes simplicity and learning
- Rent is reclaimed when tasks are deleted

## Repository Structure

```
program-imaad666/
├── anchor_project/
│   └── task_manager/          # Anchor program
│       ├── programs/
│       │   └── task_manager/
│       │       └── src/
│       │           └── lib.rs # Main program code
│       ├── tests/
│       │   └── task_manager.ts # Comprehensive test suite
│       └── target/
│           ├── idl/           # Generated IDL
│           └── types/         # TypeScript types
├── frontend/                  # Next.js frontend
│   ├── app/                   # App router pages
│   ├── components/            # React components
│   ├── idl/                   # Program IDL
│   └── types/                 # TypeScript types
└── PROJECT_DESCRIPTION.md     # This file
```

## Conclusion

This Task Manager dApp demonstrates a complete understanding of Solana program development, from smart contract implementation to frontend integration. It showcases:

- ✅ Anchor program with PDAs
- ✅ Comprehensive testing (22 tests, all passing)
- ✅ Deployed to Devnet
- ✅ Modern, responsive frontend
- ✅ Wallet integration
- ✅ Complete documentation

The project is production-ready for Devnet and serves as a solid foundation for more complex Solana applications.
