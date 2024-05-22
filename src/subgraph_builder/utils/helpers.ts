export function getSubgraphName(
  chainId: number,
  environment: "production" | "development" | "local",
  subgraphNumber: number
) {
  return `tide-${
    environment === "production" ? "listener" : "dev"
  }-${chainId}-${subgraphNumber}`;
}
