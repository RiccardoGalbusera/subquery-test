/*
  This file contains all the code that is injected into the mapping event handlers
*/

import { parseContractName } from "../utils/parseNames";

export const fixedImports = `import { trackEvent } from "../utils/entities";\n`;

export function eventTracker(
  eventName: string,
  eventId: string,
  tasks: string[],
  contractAddress: string
) {
  const parsedContractName = parseContractName(contractAddress);
  return `import { ${eventName} as ${eventName}_${eventId}} from "../../generated/${parsedContractName}/${parsedContractName}";
  export function handle${eventId}(event: ${eventName}_${eventId}): void {
    trackEvent(event, "${eventId}", ["${tasks.join('","')}"]);
  }\n`;
}
