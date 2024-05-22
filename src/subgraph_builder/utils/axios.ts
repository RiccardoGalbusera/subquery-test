import axios from "axios";
import { getContractCreationBlockNumber } from "./block";

axios.defaults.baseURL = process.env.API_URL;

export async function axiosRequest(options: any) {
  try {
    const res = await axios.request(options);
    return res.data;
  } catch (err: any) {
    console.log(err);
    return err.response.data;
  }
}

export type TideEvent = {
  id: string;
  createdAt: string;
  updatedAt: string;
  address: string;
  abi: string;
  event: string;
  chainId: number;
  taskId: string;
  startBlock: number;
  taskIds: string[];
};

export async function getCampaignOnChainEvents(
  cid: string,
  chainId: number
): Promise<TideEvent[]> {
  const res = await axiosRequest({
    url: `/task/events?cid=${cid}&chainId=${Number(chainId)}`,
    method: "GET",
  });

  return res;
}

export async function getPerformanceContract(
  performanceContractId: string
): Promise<TideEvent> {
  let res = await axiosRequest({
    url: `/performance/contract?performanceContractId=${performanceContractId}`,
    method: "GET",
  });

  res = { ...res, chainId: res.chain };

  const startBlock = await getContractCreationBlockNumber({
    chainId: res.chainId,
    address: res.address,
  });

  res["startBlock"] = startBlock;
  res["event"] = JSON.parse(res.abi)[0].name;
  return res;
}
