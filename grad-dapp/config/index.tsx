import { cookieStorage, createStorage } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum } from '@reown/appkit/networks'
import type { Chain } from '@wagmi/core/chains'

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Scroll Sepolia Testnet
export const scrollSepolia: Chain = {
  id: 534351,
  name: 'Scroll Sepolia Testnet',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ['https://534351.rpc.thirdweb.com']
    }
  },
  blockExplorers: {
    default: {
      name: 'ScrollScan',
      url: 'https://sepolia.scrollscan.com'
    }
  },
  testnet: true
}

// Holesky
export const holesky: Chain = {
  id: 17000,
  name: 'Holesky',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ['https://1rpc.io/holesky']
    }
  },
  blockExplorers: {
    default: {
      name: 'Holesky Explorer',
      url: 'https://holesky.beaconcha.in'
    }
  },
  testnet: true
}

// All Networks
export const networks = [mainnet, arbitrum, scrollSepolia, holesky]

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig
