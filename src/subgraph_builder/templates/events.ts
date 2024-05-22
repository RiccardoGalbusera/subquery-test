/*
  This file contains all the code that is injected into the mapping event handlers
*/

import { parseContractName } from "../utils/parseNames";

export const fixedImports = `import { trackEvent } from "../utils/entities";\n`;

export function eventTracker(
  eventName: string,
  eventId: string,
  tasks: string[],
  contractAddress: string,
  eventParamNames: string[]
) {
  const parsedContractName = parseContractName(contractAddress);
  const capitalizedContractName =
    parsedContractName.charAt(0).toUpperCase() + parsedContractName.slice(1);
  return `import { ${eventName}Event as ${eventName}_${eventId}} from "../types/contracts/${capitalizedContractName}";
  export async function handle${eventId}(event: ${eventName}_${eventId}): Promise<void> {
    await trackEvent(event, "${eventId}", ["${tasks.join(
    '","'
  )}"],["${eventParamNames.join('","')}"])}\n`;
}
