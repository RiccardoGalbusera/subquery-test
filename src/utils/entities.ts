import { BigNumber } from "ethers";
import { Interaction, Param } from "../types";
import { ClaimedEvent } from "../types/contracts/X3f16f8964f8f5ab58929b58619056461f37f7317";
import { getUserOrCreate } from "./getters";

export async function trackEvent(
  event: ClaimedEvent,
  eventId: string,
  tasks: string[],
  paramNames: string[]
) {
  const transaction = await event.getTransaction();
  const block = await event.getBlock();
  const user = await getUserOrCreate(transaction.from);
  for (let i = 0; i < tasks.length; i++) {
    const interaction = Interaction.create({
      id: `${event.transactionHash}-${eventId}-${tasks[i]}-${event.logIndex}`,
      userId: user.id,
      interactedWith: event.address,
      taskId: tasks[i],
      createdAt: BigInt(block.timestamp),
      txHash: event.transactionHash,
      blockTimestamp: BigInt(block.timestamp),
      blockNumber: BigInt(block.number),
      logIndex: BigInt(event.logIndex),
    });

    await interaction.save();

    for (let j = 0; j < event.args.length; j++) {
      const arg = event.args[j];
      const name = paramNames[j];
      const param = Param.create({
        id: `${interaction.id}-${name}`,
        interactionId: interaction.id,
        name,
        value: parseValueToString(arg),
      });

      await param.save();
    }
  }
}

function parseValueToString(value: string | BigNumber) {
  if (typeof value === "string") return value;
  else return value.toString();
}
