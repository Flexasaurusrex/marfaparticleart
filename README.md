# Marfa Particle Art 🌵

Interactive desert-inspired particle art NFT collection from Marfa, Texas.

## Features

- **15 Unique Desert Shapes**
  - Saguaro Cactus
  - Prickly Pear
  - Desert Flower
  - Tumbleweed
  - Mesa
  - Sand Dune
  - Desert Sun
  - Crescent Moon
  - Roadrunner
  - Coyote
  - Yucca
  - Agave
  - Rock Formation
  - Desert Star
  - Marfa Lights

- **Interactive NFTs** - Fully interactive with embedded HTML
- **Undo/Redo** - Full design history tracking
- **Mobile Responsive** - Works perfectly on all devices
- **Desert Presets** - Sunset, Night, Desert, Cactus, Marfa, Heat
- **Base Network** - Deployed on Base for low fees

## Collection Details

- **Supply:** 333 NFTs
- **Chain:** Base
- **Mint:** Free (gas only)
- **Royalties:** 10% to creator

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id
```

3. Update contract address in `pages/index.js` after deploying

4. Run locally:
```bash
npm run dev
```

## Deployment

### Smart Contract
Deploy `contracts/MarfaParticleArt.sol` to Base using Remix or thirdweb

### Website
1. Import to Vercel from GitHub
2. Add environment variables
3. Deploy!

## Contract Address
Update after deployment: `0xYOUR_CONTRACT_ADDRESS`

## Live Site
Update after deployment: `https://your-site.vercel.app`

## Built With
- Next.js
- React
- Ethers.js
- Thirdweb
- Canvas API

## License
MIT
