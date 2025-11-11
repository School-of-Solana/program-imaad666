# Task Manager - Solana Program

This is the Solana program (smart contract) for the Task Manager dApp, built using the Anchor framework.

## What it does

A simple on-chain task manager where each user can create, update, complete, and delete their own tasks. Each user's tasks are stored in Program Derived Addresses (PDAs) for easy access and security.

## Building

```bash
cd task_manager
anchor build
```

## Testing

```bash
anchor test
```

All tests should pass - there are tests for creating tasks, toggling completion, updating, deleting, and various error cases.

## Deploying

Already deployed to devnet at: `13AyfsUmh9iow5qF83SV5hv9imBdAFFgvSbjdBQUceuk`

To deploy yourself:
```bash
anchor deploy
```

## Program Structure

- User accounts track task count and completed count
- Tasks have title, description, priority, and completion status
- Everything is stored on-chain using PDAs
