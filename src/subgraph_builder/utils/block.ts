import { chainSlugToId, taskNetworks } from "./constants";
import axios from "axios";
import { getWeb3Provider } from "./provider";

export async function getContractCreationBlockNumber(data: {
  address: string;
  chainId: number;
}): Promise<number> {
  const taskNetwork = taskNetworks[data.chainId];
  let url = taskNetwork.chainScannerApiBaseUrl;
  const provider = getWeb3Provider(data.chainId);

  const chainId = Number(data.chainId);
  if (
    chainId === chainSlugToId.get("neonlabs") ||
    chainId === chainSlugToId.get("shimmerevm")
  ) {
    url = url.concat(`/addresses/${data.address}`);

    let blockNumber = 1;
    try {
      const txHash = (await axios.get(url)).data.creation_tx_hash;
      if (!txHash) return blockNumber;
      else return Number((await provider.getTransaction(txHash)).blockNumber);
    } catch (e) {
      console.error(
        `Failed while fetching contract creation tx hash for Neon. Data: ${JSON.stringify(
          data
        )}`
      );
      console.error(e);
    }

    return blockNumber;
  }

  url = url.concat(
    `?module=contract&action=getcontractcreation&contractaddresses=${data.address}&apiKey=${taskNetwork.chainScannerApiKey}`
  );

  const response: {
    status: string;
    message: string;
    result: [{ txHash: string }];
  } = (await axios.get(url)).data;

  if (response.message !== "OK") {
    if (response.message.toLowerCase().includes("api key"))
      console.log("Missing chain scanner api key for chain " + data.chainId);
    else {
      console.error(
        `Failed while fetching chain scanner with data ${JSON.stringify(
          data
        )}. Using 1 as start block. Full response: ${JSON.stringify(response)}`
      );
      return 1;
    }
  }

  const txHash = response.result[0].txHash;

  if (!txHash) {
    console.error(
      `Could not get contract creation tx hash with data ${JSON.stringify(
        data
      )}. Using 1 as start block. Full response: ${JSON.stringify(response)}`
    );
  }

  const blockNumber = (await provider.getTransaction(txHash)).blockNumber;
  return Number(blockNumber);
}
