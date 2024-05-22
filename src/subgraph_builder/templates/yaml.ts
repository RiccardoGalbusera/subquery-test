/*
  This file contains all the code that is injected into the subgraph.yaml file
  which contains all the info about the data sources and events to track
*/

import { parseContractName, parseEvent, parseId } from "../utils/parseNames.js";

export const head = `specVersion: 0.0.4
schema:
  file: ./schema.graphql
dataSources:\n`;

//@dev compilation depends on tabbing and newlines, please be careful when editing
export function eventDataSource(
  chainSlug: string,
  events: { abi: string; event: string; id: string }[],
  contractAddress: string,
  startBlock: number
) {
  const parsedContractName = parseContractName(contractAddress);
  const dataSourceString = ` - kind: ethereum
   name: ${parsedContractName}
   network: ${chainSlug}
   source:
     abi: ${parsedContractName}
     address: "${contractAddress}"
     startBlock: ${startBlock ?? 1}
   mapping:
     kind: ethereum/events
     apiVersion: 0.0.6
     language: wasm/assemblyscript
     entities:
       - Interaction
       - Param
       - User
     abis:
       - name: ${parsedContractName}
         file: ./abis/generated/${parsedContractName}.json 
     eventHandlers:
     ${events
       .map(
         (event) =>
           `  - event: ${parseEvent(event)}
         handler: handle${parseId(event.id)}`
       )
       .join("\n     ")}    
     file: ./src/mappings/events.ts\n`;

  return dataSourceString;
}

export function campaignDataSource(
  chainSlug: string,
  campaignId: string,
  campaignAddress: string,
  startBlock: number
) {
  const dataSourceString = ` - kind: ethereum
   name: ${parseId(campaignId)}
   network: ${chainSlug}
   source:
     abi: ERC721
     address: "${campaignAddress}"
     startBlock: ${startBlock ?? 1}
   mapping:
     kind: ethereum/events
     apiVersion: 0.0.6
     language: wasm/assemblyscript
     entities:
       - Badge
       - User
     abis:
       - name: ERC721
         file: ./abis/ERC721.json 
     eventHandlers:
       - event: Transfer(indexed address,indexed address,indexed uint256)    
         handler: handleTransfer
     file: ./src/mappings/badges.ts\n`;

  return dataSourceString;
}
