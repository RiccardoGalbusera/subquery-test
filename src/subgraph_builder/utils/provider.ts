import { ethers } from "ethers";

export function getWeb3Provider(chainId: number) {
  const rpcUrl = rpcUrls[chainId];
  if (!rpcUrl) throw new Error(`No RPC URL for chainId ${chainId}`);

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  return provider;
}

const rpcUrls: Record<number, string> = {
  1: "https://eth.llamarpc.com",
  10: "https://mainnet.optimism.io",
  56: "https://bsc-dataseed.binance.org",
  100: "https://rpc.gnosischain.com	",
  122: "https://rpc.fuse.io",
  137: "https://polygon.llamarpc.com",
  148: "https://json-rpc.evm.shimmer.network",
  250: "https://rpcapi.fantom.network",
  288: "https://mainnet.boba.network",
  1284: "https://rpc.api.moonbeam.network",
  1285: "https://rpc.api.moonriver.moonbeam.network",
  42161: "https://arb1.arbitrum.io/rpc",
  42220: "https://forno.celo.org",
  43114: "https://avalanche.public-rpc.com",
  245022934: "https://neon-proxy-mainnet.solana.p2p.org",
  1313161554: "https://mainnet.aurora.dev",
  1666600000: "https://api.harmony.one",
};
