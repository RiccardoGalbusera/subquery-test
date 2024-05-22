import { parseContractName } from "../utils/parseNames";
import { eventTracker, fixedImports } from "../templates/events";
import { eventDataSource, head, tail } from "../templates/project";
import fs from "fs";
import { exec } from "child_process";
import { TideEvent } from "../utils/axios";

type Abi = Array<{
  name: string;
  type: string;
  inputs: Array<{
    name: string;
  }>;
}>;

// Build the project.ts file, which contains the data sources info
export async function buildProjectFile(
  eventsByContract: Record<string, TideEvent[]>,
  name: string,
  chainId: number
) {
  let fileString = head(name, chainId);

  Object.values(eventsByContract).forEach((contract) => {
    fileString = fileString.concat(
      eventDataSource(
        contract,
        contract[0].address,
        Math.min(...contract.map((event) => event.startBlock))
      )
    );
  });

  fs.writeFileSync("./project.ts", fileString.concat(tail));
  await new Promise((resolve) => setTimeout(resolve, 1_000));

  return fileString;
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
      const eventAbi = (JSON.parse(event.abi) as Abi).find(
        (abi) => abi.name === event.event && abi.type === "event"
      );

      mappingsString = mappingsString.concat(
        eventTracker(
          event.event,
          event.id.replace(/-/g, "_"),
          event.taskIds,
          event.address,
          eventAbi!.inputs.map((p) => p.name)
        )
      );
    });
  });
  fs.writeFileSync("./src/mappings/mappingHandlers.ts", mappingsString);
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
