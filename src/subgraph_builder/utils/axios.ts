import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

axios.defaults.baseURL = process.env.API_URL;

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
  cids: string[],
  chainId: number
): Promise<TideEvent[]> {
  const res = await axios.request<TideEvent[]>({
    url: `/task/${chainId}/events`,
    method: "POST",
    data: { cids },
  });

  return res.data;
}

export async function getPerformanceContract(
  performanceContractId: string
): Promise<TideEvent> {
  let res = await axios.request({
    url: `/performance/contract?performanceContractId=${performanceContractId}`,
    method: "GET",
  });

  const data = { ...res.data, chainId: res.data.chain };

  data["startBlock"] = 1;
  data["event"] = JSON.parse(data.abi)[0].name;
  return data;
}
