import { buildAndDeploySubgraph } from "./index";

// @dev Change this with whatever you need to deploy
const data = {
  cid: "cb85cdc9-f080-4adb-8899-84cb4f4323b8",
  chainId: 11235,
  subgraphNumber: 1,
  environment: "local" as const,
  performanceContractId: "",
};

buildAndDeploySubgraph(data);
