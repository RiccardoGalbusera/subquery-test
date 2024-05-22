import { buildAndDeploySubgraph } from "./index";

// @dev Change this with whatever you need to deploy
const data = {
  cid: "20d56549-59f9-4685-a255-34a67c672c22",
  chainId: 5234,
  subgraphNumber: 1,
  environment: "local" as const,
  performanceContractId: "",
};

buildAndDeploySubgraph(data);
