import {
  EthereumProject,
  EthereumDatasourceKind,
  EthereumHandlerKind,
} from "@subql/types-ethereum";
import * as dotenv from "dotenv";
import path from "path";

const mode = process.env.NODE_ENV || "production";

// Load the appropriate .env file
const dotenvPath = path.resolve(
  process.cwd(),
  `.env${mode !== "production" ? `.${mode}` : ""}`
);
dotenv.config({ path: dotenvPath });

const project: EthereumProject = {
  specVersion: "1.0.0",
  version: "0.0.1",
  name: "tide-dev-5234-1",
  description: "Tide event tracker",
  runner: {
    node: {
      name: "@subql/node-ethereum",
      version: ">=3.0.1",
    },
    query: {
      name: "@subql/query",
      version: "*",
    },
  },
  schema: {
    file: "./schema.graphql",
  },
  network: {
    chainId: "5234",
    endpoint: ["https://explorer-rpc-http.mainnet.stages.humanode.io"],
  },
  dataSources: [
    {
      kind: EthereumDatasourceKind.Runtime,
      startBlock: 7726010,
      options: {
        abi: "x3f16f8964f8f5ab58929b58619056461f37f7317",
        address: "0x3f16f8964f8f5ab58929b58619056461f37f7317",
      },
      assets: new Map([
        [
          "x3f16f8964f8f5ab58929b58619056461f37f7317",
          {
            file: "./abis/generated/x3f16f8964f8f5ab58929b58619056461f37f7317.json",
          },
        ],
      ]),
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            handler: "handle9dfe8ce3_cf5b_46ba_a050_993b27b3f55f",
            kind: EthereumHandlerKind.Event,
            filter: {
              topics: ["Claimed(address indexed user,uint256 indexed tokenId)"],
            },
          },
        ],
      },
    },
  ],
};

// Must set default to the project instance
export default project;
