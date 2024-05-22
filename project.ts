import { SubstrateProject } from "@subql/types";
import { FrontierEvmDatasource } from "@subql/frontier-evm-processor";
import * as dotenv from "dotenv";
import path from "path";

const mode = process.env.NODE_ENV || "production";

// Load the appropriate .env file
const dotenvPath = path.resolve(
  process.cwd(),
  `.env${mode !== "production" ? `.${mode}` : ""}`
);
dotenv.config({ path: dotenvPath });

const project: SubstrateProject<FrontierEvmDatasource> = {
  specVersion: "1.0.0",
  version: "0.0.1",
  name: "tide-dev-5234-1",
  description: "Tide event tracker",
  runner: {
    node: {
      name: "@subql/node",
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
    endpoint: process.env.ENDPOINT!?.split(",") as string[] | string,
  },
  dataSources: [
{
      kind: "substrate/FrontierEvm",
      startBlock: 7726010,
      processor: {
        file: "./node_modules/@subql/frontier-evm-processor/dist/bundle.js",
        options: {
          abi: "x3f16f8964f8f5ab58929b58619056461f37f7317",
          address: "0x3f16f8964f8f5ab58929b58619056461f37f7317",
        },
      },
      assets: new Map([["x3f16f8964f8f5ab58929b58619056461f37f7317", { file: "./abis/generated/x3f16f8964f8f5ab58929b58619056461f37f7317.json" }]]),
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            handler: "9dfe8ce3_cf5b_46ba_a050_993b27b3f55f",
            kind: "substrate/FrontierEvmEvent",
            filter: {
              topics: [
                "Claimed(indexed address,indexed uint256)",
              ],
            },
          },
        ],
      },
    },]};

// Must set default to the project instance
export default project;