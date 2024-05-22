/*
  This file contains all the code that is injected into the subgraph.yaml file
  which contains all the info about the data sources and events to track
*/

import { parseContractName, parseEvent, parseId } from "../utils/parseNames";

export const head: (name: string, chainId: number) => string = (
  name,
  chainId
) => `import { SubstrateProject } from "@subql/types";
import { FrontierEvmDatasource } from "@subql/frontier-evm-processor";
import * as dotenv from "dotenv";
import path from "path";

const mode = process.env.NODE_ENV || "production";

// Load the appropriate .env file
const dotenvPath = path.resolve(
  process.cwd(),
  \`.env\${mode !== "production" ? \`.\${mode}\` : ""}\`
);
dotenv.config({ path: dotenvPath });

const project: SubstrateProject<FrontierEvmDatasource> = {
  specVersion: "1.0.0",
  version: "0.0.1",
  name: "${name}",
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
    chainId: "${chainId}",
    endpoint: process.env.ENDPOINT!?.split(",") as string[] | string,
  },
  dataSources: [\n`;

export function eventDataSource(
  events: { abi: string; event: string; id: string }[],
  contractAddress: string,
  startBlock: number
) {
  const parsedContractName = parseContractName(contractAddress);

  return `{
      kind: "substrate/FrontierEvm",
      startBlock: ${startBlock},
      processor: {
        file: "./node_modules/@subql/frontier-evm-processor/dist/bundle.js",
        options: {
          abi: "${parsedContractName}",
          address: "${contractAddress}",
        },
      },
      assets: new Map([["${parsedContractName}", { file: "./abis/generated/${parsedContractName}.json" }]]),
      mapping: {
        file: "./dist/index.js",
        handlers: [
          ${events
            .map(
              (event) => `{
            handler: "${parseId(event.id)}",
            kind: "substrate/FrontierEvmEvent",
            filter: {
              topics: [
                "${parseEvent(event)}",
              ],
            },
          },`
            )
            .join("\n")}
        ],
      },
    },`;
}

export const tail = `]};

// Must set default to the project instance
export default project;`;
