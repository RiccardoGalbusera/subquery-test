import dotenv from "dotenv";
dotenv.config();

export const env = Object.freeze({
  ARBISCAN_API_KEY: process.env.ARBISCAN_API_KEY,
  BSCSCAN_API_KEY: process.env.BSCSCAN_API_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
  OPTIMISTIC_ETHERSCAN_API_KEY: process.env.OPTIMISTIC_ETHERSCAN_API_KEY,
  POLYGONSCAN_API_KEY: process.env.POLYGONSCAN_API_KEY,
});

export const chainSlugToId: Map<string, number> = new Map([
  ["mainnet", 1],
  ["optimism", 10],
  ["bsc", 56],
  ["matic", 137],
  ["shimmerevm", 148],
  ["haqq", 11235],
  ["arbitrum-one", 42161],
  ["arbitrum-sepolia", 421614],
  ["neonlabs", 245022934],
]);

export const taskNetworks: Record<
  number,
  { chainScannerApiKey: string; chainScannerApiBaseUrl: string }
> = {
  1: {
    chainScannerApiBaseUrl: "https://api.etherscan.io/api",
    chainScannerApiKey: env.ETHERSCAN_API_KEY!,
  },
  10: {
    chainScannerApiBaseUrl: "https://api-optimistic.etherscan.io/api",
    chainScannerApiKey: env.OPTIMISTIC_ETHERSCAN_API_KEY!,
  },
  137: {
    chainScannerApiBaseUrl: "https://api.polygonscan.io/api",
    chainScannerApiKey: env.POLYGONSCAN_API_KEY!,
  },
  148: {
    chainScannerApiBaseUrl: "https://explorer.evm.shimmer.network/api/v2",
    chainScannerApiKey: "",
  },
  42161: {
    chainScannerApiBaseUrl: "https://api.arbiscan.io/api",
    chainScannerApiKey: env.ARBISCAN_API_KEY!,
  },
  245022934: {
    chainScannerApiBaseUrl: "https://neon.blockscout.com/api/v2",
    chainScannerApiKey: "",
  },
  56: {
    chainScannerApiBaseUrl: "https://api.bscscan.com/api",
    chainScannerApiKey: env.BSCSCAN_API_KEY!,
  },
  421614: {
    chainScannerApiBaseUrl: "https://api-sepolia.arbiscan.io/api",
    chainScannerApiKey: env.ARBISCAN_API_KEY!,
  },
};
