import util from "util";
import AWS from "aws-sdk";
import { exec } from "child_process";

import {
  checkEnv,
  checkSubgraphDeploymentStatus,
  getDeployCommand,
} from "../utils/helpers";
import {
  TideEvent,
  getCampaignOnChainEvents,
  getPerformanceContract,
} from "../utils/axios";
import {
  buildYamlFile,
  buildMappingsFile,
  writeAbisForContracts,
} from "./builders";

AWS.config.update({ region: "eu-west-1" });

const execPromisified = util.promisify(exec);
const TIDE_LISTENER_QUEUE_URL = {
  production:
    "https://sqs.eu-west-1.amazonaws.com/432356174589/tide-listener-queue",
  development:
    "https://sqs.eu-west-1.amazonaws.com/432356174589/tide-listener-queue-dev",
};

export async function buildAndDeploySubgraph(args: {
  cid: string;
  chainId: number;
  subgraphNumber: number;
  environment: "production" | "development" | "local";
  performanceContractId?: string;
}): Promise<boolean> {
  const { cid, chainId, subgraphNumber, environment, performanceContractId } =
    args;

  let events: TideEvent[] = [];
  if (performanceContractId)
    events = [await getPerformanceContract(performanceContractId)];
  else events = await getCampaignOnChainEvents(cid, chainId);

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

  await buildYamlFile(eventsByContract, chains[chainId].slug);

  let res;
  try {
    const deployCommand = await getDeployCommand(
      chainId,
      environment,
      subgraphNumber,
      performanceContractId
    );
    res = await execPromisified(deployCommand);
  } catch (e) {
    console.warn(e);
  }

  const success = checkSubgraphDeploymentStatus(res);

  if (!success) {
    console.log("--------------- Subgraph failed to deploy -----------------");
    console.log(res?.stderr);
  }

  return success;
}

async function main() {
  checkEnv();

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
        cid,
        chainId,
        subgraphNumber,
        environment,
        performanceContractId,
      } = JSON.parse(message.Body);
      console.log(`Processing message: ${message.Body}`);
      const success = await buildAndDeploySubgraph({
        cid,
        chainId,
        subgraphNumber,
        environment,
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

export const chains: Record<number, { name: string; slug: string }> = {
  1: {
    name: "Ethereum",
    slug: "mainnet",
  },
  10: {
    name: "Optimism",
    slug: "optimism",
  },
  56: {
    name: "BSC",
    slug: "bsc",
  },
  137: {
    name: "Polygon",
    slug: "matic",
  },
  148: {
    name: "Shimmer EVM",
    slug: "shimmerevm",
  },
  11235: {
    name: "Haqq Network",
    slug: "haqq",
  },
  42161: {
    name: "Arbitrum",
    slug: "arbitrum-one",
  },
  421614: {
    name: "Arbitrum-Sepolia",
    slug: "arbitrum-sepolia",
  },
  245022934: {
    name: "Neon EVM",
    slug: "neonlabs",
  },
};
