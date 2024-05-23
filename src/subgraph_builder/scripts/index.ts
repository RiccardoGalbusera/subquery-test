import util from "util";
import AWS from "aws-sdk";
import { exec } from "child_process";

import { getSubgraphName } from "../utils/helpers";
import {
  TideEvent,
  getCampaignOnChainEvents,
  getPerformanceContract,
} from "../utils/axios";
import {
  buildMappingsFile,
  writeAbisForContracts,
  buildProjectFile,
} from "./builders";
import fs from "fs";
import { rpcUrl } from "../utils/networks";

AWS.config.update({ region: "eu-west-1" });

const execPromisified = util.promisify(exec);
const TIDE_LISTENER_QUEUE_URL = {
  production:
    "https://sqs.eu-west-1.amazonaws.com/432356174589/tide-listener-queue",
  development:
    "https://sqs.eu-west-1.amazonaws.com/432356174589/tide-listener-queue-dev",
};

export async function buildAndDeploySubgraph(args: {
  cids: string[];
  chainId: number;
  subgraphNumber: number;
  performanceContractId?: string;
}): Promise<boolean> {
  const { cids, chainId, subgraphNumber, performanceContractId } = args;

  let events: TideEvent[] = [];
  if (performanceContractId)
    events = [await getPerformanceContract(performanceContractId)];
  else events = await getCampaignOnChainEvents(cids, chainId);

  // Group events by contract address and event name
  const eventsByContract = events.reduce((acc, event) => {
    if (!acc[event.address]) {
      event.taskIds = [event.id];
      acc[event.address] = [event];
    } else {
      const contractEvents = acc[event.address];
      const contractEvent = contractEvents.find(
        (contractEvent) => contractEvent.event === event.event
      );

      if (contractEvent) contractEvent.taskIds.push(event.id);
      else {
        event.taskIds = [event.id];
        acc[event.address].push(event);
      }
    }

    return acc;
  }, {} as Record<string, TideEvent[]>);

  await writeAbisForContracts(eventsByContract);

  await buildMappingsFile(eventsByContract);

  const subgraphName = getSubgraphName(chainId, subgraphNumber);
  await buildProjectFile(eventsByContract, subgraphName, chainId);

  try {
    console.log("Files built, publishing on IPFS...");
    await execPromisified("yarn codegen && yarn build && subql publish");
    const deployId = fs.readFileSync(".project-cid", { encoding: "utf-8" });
    console.log("Publish successful, deploying to subquery...");
    await execPromisified(
      `export SUBQL_ACCESS_TOKEN=${process.env.SUBQL_ACCESS_TOKEN} && subql deployment:deploy -d --ipfsCID=${deployId} --org="FEL-developers" --projectName="${subgraphName}" --type=primary --endpoint="${rpcUrl[chainId]}"`
    );
    return true;
  } catch (e) {
    console.warn(e);
    return false;
  }
}

async function main() {
  const boundedQueue = new AWS.SQS();

  const environment = process.argv[2];
  const QueueUrl =
    environment === "production"
      ? TIDE_LISTENER_QUEUE_URL.production
      : TIDE_LISTENER_QUEUE_URL.development;
  const getParams = {
    QueueUrl,
    MaxNumberOfMessages: 1,
    AttributeNames: ["SentTimestamp"],
  };

  while (true) {
    let message;

    try {
      const res = await boundedQueue.receiveMessage(getParams).promise();
      message = res.Messages?.[0];
    } catch (err) {
      console.warn(`Error receiving message from queue: ${err}`);
    }

    if (!message) {
      console.log("No messages found, retrying in 10 seconds.");
      await new Promise((r) => setTimeout(r, 10000));
      continue;
    }

    if (message && message.Body) {
      const {
        cids,
        chainId,
        subgraphNumber,
        environment,
        performanceContractId,
      } = JSON.parse(message.Body);

      if (
        Object.keys(rpcUrl).includes(chainId) &&
        environment === "production"
      ) {
        console.log(`Processing message: ${message.Body}`);
        const success = await buildAndDeploySubgraph({
          cids,
          chainId,
          subgraphNumber,
          performanceContractId,
        });
        console.log(`Deleting message: ${message.Body}`);
        const deleteParams = {
          QueueUrl,
          ReceiptHandle: message.ReceiptHandle || "",
        };

        try {
          await boundedQueue.deleteMessage(deleteParams).promise();
        } catch (err) {
          console.warn(`Error deleting message from queue: ${err}`);
        }

        // @dev we don't handle subgraph deploy errors yet.
        // Ideally we should propagate this error to Tide backend and do something.
        // Usually if the deploy fails there's no point in retrying after 10s.
        if (!success) console.log(`Subgraph deploy failed.`);
      }
    }

    console.log("Finished all jobs. Waiting 10 seconds.");
    await new Promise((r) => setTimeout(r, 10000));
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
