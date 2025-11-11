# Frontend Deployment Instructions

## Deploy to Vercel

### Option 1: Using Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository: `School-of-Solana/program-imaad666`
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Click "Deploy"

### Option 2: Using Vercel CLI

```bash
cd frontend
npx vercel login
npx vercel --prod
```

## After Deployment

1. Copy the deployment URL from Vercel
2. Update `PROJECT_DESCRIPTION.md` with the frontend URL
3. Test the dApp with Phantom or Solflare wallet on Devnet

## Important Notes

- The dApp is configured to use Solana Devnet
- Program ID: `13AyfsUmh9iow5qF83SV5hv9imBdAFFgvSbjdBQUceuk`
- Make sure your wallet is set to Devnet
- You'll need Devnet SOL to interact with the dApp (use `solana airdrop`)

