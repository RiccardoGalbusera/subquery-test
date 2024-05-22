import { parseContractName } from "../utils/parseNames";
import { eventTracker, fixedImports } from "../templates/events";
import { eventDataSource, head } from "../templates/yaml";
import fs from "fs";
import { exec } from "child_process";
import { TideEvent } from "../utils/axios";

// Build the subgraph.yaml file, which contains the data sources info
export async function buildYamlFile(
  eventsByContract: Record<string, TideEvent[]>,
  chainSlug: string
) {
  let yamlString = head;

  Object.values(eventsByContract).forEach((contract) => {
    yamlString = yamlString.concat(
      eventDataSource(
        chainSlug,
        contract,
        contract[0].address,
        Math.min(...contract.map((event) => event.startBlock))
      )
    );
  });

  fs.writeFileSync("./subgraph.yaml", yamlString);
  await new Promise((resolve) => setTimeout(resolve, 1_000));

  return yamlString;
}

// Build the mappings.ts file, which contains the code that will be compiled to WASM
export async function buildMappingsFile(
  eventsByContract: Record<string, TideEvent[]>
) {
  exec("mkdir -p src/mappings");
  await new Promise((resolve) => setTimeout(resolve, 1_000));

  let mappingsString = fixedImports;
  Object.values(eventsByContract).forEach((contract) => {
    contract.forEach((event) => {
      mappingsString = mappingsString.concat(
        eventTracker(
          event.event,
          event.id.replace(/-/g, "_"),
          event.taskIds,
          event.address
        )
      );
    });
  });
  fs.writeFileSync("./src/mappings/events.ts", mappingsString);
  await new Promise((resolve) => setTimeout(resolve, 1_000));

  return mappingsString;
}

// Write the abis for each contract to the abis folder
export async function writeAbisForContracts(
  eventsByContract: Record<string, TideEvent[]>
) {
  exec("mkdir -p abis && mkdir -p abis/generated");
  await new Promise((resolve) => setTimeout(resolve, 1_000));

  Object.values(eventsByContract).forEach((contract) => {
    let fullAbi: any[] = [];
    for (const eventString of contract) {
      const parsedEvent = JSON.parse(eventString.abi)[0];
      if (!fullAbi.includes(parsedEvent)) fullAbi.push(parsedEvent);
    }

    fs.writeFileSync(
      `./abis/generated/${parseContractName(contract[0].address)}.json`,
      JSON.stringify(fullAbi)
    );
  });

  await new Promise((resolve) => setTimeout(resolve, 1_000));
  return "Abis written";
}
