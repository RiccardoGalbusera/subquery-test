export function parseContractName(contractAddress: string) {
  //@dev build failes if contract name starts with a number
  const name = contractAddress.slice(1);
  return name;
}

export function parseId(id: string) {
  //@dev cannot have names with dashes
  return id.replace(/-/g, "_");
}

export function parseEvent(event: { abi: string; event: string }) {
  const abiOfEvent = JSON.parse(event.abi).find(
    (abi: { name: string; type: string }) =>
      abi.name === event.event && abi.type === "event"
  );
  return `${abiOfEvent.name}(${parseInputs(abiOfEvent.inputs)})`;
}

function parseInputs(inputs: any[]): string {
  return inputs
    .map((input) => {
      if (input.type === "tuple") {
        return `(${parseInputs(input.components)})`;
      } else if (input.type === "tuple[]") {
        return `(${parseInputs(input.components)})[]`;
      } else return (input.indexed ? "indexed " : "") + input.type;
    })
    .join(",");
}
