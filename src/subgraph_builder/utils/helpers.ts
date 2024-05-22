import { chainSlugToId, env } from "./constants.js";
import { updateSubgraphVersion, getSubgraphVersion } from "./pg";

export function checkSubgraphDeploymentStatus(res: any) {
  const success = res?.stdout?.includes(
    "Deployed to https://thegraph.com/explorer/subgraph/fel-developers/tide-"
  );

  if (!success) console.error(res?.stdout);

  return success;
}

/**
 * Check if all environment variables are set
 * @throws
 */
export function checkEnv() {
  for (const variable of Object.values(env))
    if (!variable)
      throw new Error(
        `Missing environment variable. Please update your .env file.`
      );
}

/**
 * @param {number} chainId
 * @param {"production" | "development"} environment
 * @param {number} subgraphNumber
 * @param {string} performanceContractId (uuid)
 */
export async function getDeployCommand(
  chainId: number,
  environment: "production" | "development" | "local",
  subgraphNumber: number,
  performanceContractId?: string
) {
  const isNeon = Number(chainId) === chainSlugToId.get("neonlabs");
  const isShimmer = Number(chainId) === chainSlugToId.get("shimmerevm");
  const isBase = Number(chainId) === chainSlugToId.get("base");
  const isHaqqNetwork = Number(chainId) === chainSlugToId.get("haqq");
  if (isNeon) {
    const tableName = "NeonSubgraph";
    const newVersion =
      (await getSubgraphVersion(subgraphNumber, tableName)) + 1;
    await updateSubgraphVersion(subgraphNumber, newVersion, tableName);

    return `yarn codegen && npx graph deploy --ipfs https://ipfs.neonevm.org/ --node https://thegraph.neonevm.org/deploy/ --version-label='v0.0.${newVersion}' neonlabs/tide-${
      environment === "production" ? "listener" : "dev"
    }-${chainId}-${subgraphNumber}`;
  } else if (isShimmer) {
    const tableName = "ShimmerSubgraph";
    const newVersion =
      (await getSubgraphVersion(subgraphNumber, tableName)) + 1;
    await updateSubgraphVersion(subgraphNumber, newVersion, tableName);

    return `yarn codegen && npx graph deploy --ipfs http://49.13.144.26:5001/ --node http://49.13.144.26:8020/ --version-label='v0.0.${newVersion}' tide/tide-${
      environment === "production" ? "listener" : "dev"
    }-${chainId}-${subgraphNumber}`;
  } else if (isHaqqNetwork) {
    const tableName = "HaqqNetworkSubgraph";
    const newVersion =
      (await getSubgraphVersion(subgraphNumber, tableName)) + 1;
    await updateSubgraphVersion(subgraphNumber, newVersion, tableName);

    return `yarn codegen && npx graph deploy --node https://rpc.graph.haqq.sh --version-label='v0.0.${newVersion}' tide/tide-${
      environment === "production" ? "listener" : "dev"
    }-${chainId}-${subgraphNumber}`;
  }

  return `yarn codegen && npx graph deploy ${
    isBase ? "--studio " : "--product hosted-service fel-developers/"
  }${
    performanceContractId
      ? `tide-performance${
          environment === "production" ? "" : "-dev"
        }-${subgraphNumber}`
      : `tide-${
          environment === "production" ? "listener" : "dev"
        }-${chainId}-${subgraphNumber}`
  }`;
}
