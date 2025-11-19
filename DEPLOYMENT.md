# Deployment Guide

## Vercel Deployment

### Prerequisites
1. Vercel account
2. GitHub repository with the code
3. Solana program deployed to devnet/mainnet

### Steps

1. **Connect Repository to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `frontend` directory as the root directory

2. **Configure Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

3. **Environment Variables** (Optional - for custom RPC)
   - The app uses default Solana devnet RPC endpoints
   - If you need custom RPC, add:
     - `NEXT_PUBLIC_SOLANA_RPC_URL`: Your custom RPC endpoint

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Post-Deployment

1. **Update PROJECT_DESCRIPTION.md**
   - Replace `[TODO: Link to deployed Vercel frontend]` with your Vercel URL

2. **Test the Deployment**
   - Connect wallet
   - Test creating lost/found posts
   - Test admin actions (if you're the admin)

## Local Development

### Running Locally

```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Running Tests

```bash
# From project root
cd anchor_project
npm install
anchor test
```

## Program Deployment

### Deploy to Devnet

```bash
cd anchor_project
anchor build
anchor deploy --provider.cluster devnet
```

### Deploy to Mainnet

```bash
cd anchor_project
anchor build
anchor deploy --provider.cluster mainnet
```

**Note**: Make sure you have sufficient SOL in your deployer wallet for mainnet deployment.

## Troubleshooting

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Check Node.js version (should be 18+)
- Verify TypeScript compilation: `npm run build`

### RPC Connection Issues
- Default devnet RPC may be rate-limited
- Consider using a custom RPC endpoint (Alchemy, QuickNode, etc.)
- Set `NEXT_PUBLIC_SOLANA_RPC_URL` environment variable

### Wallet Connection Issues
- Ensure you're using a supported wallet (Phantom, Solflare, etc.)
- Check browser console for errors
- Verify network is set to devnet/mainnet as appropriate

