# Task Manager Frontend

The web interface for the Task Manager dApp. Built with Next.js and connects to the Solana program on devnet.

## Running Locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000

Make sure you have:
- A Solana wallet extension (Phantom or Solflare)
- Your wallet set to **Devnet**
- Some devnet SOL (get it from faucet or `solana airdrop 2`)

## How to Use

1. Connect your wallet
2. Initialize your account (first time only)
3. Create tasks with titles, descriptions, and priorities
4. Check off tasks when complete
5. Delete tasks you don't need anymore

## Deploying

Easiest way is to use Vercel:
1. Push code to GitHub
2. Import project in Vercel
3. Set root directory to `frontend`
4. Deploy

The app is configured to use devnet by default.

## Tech Stack

- Next.js 16
- Solana Wallet Adapter
- Anchor (for interacting with the program)
- Tailwind CSS
