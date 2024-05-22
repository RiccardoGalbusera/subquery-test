import { ethers } from "ethers";
import { User } from "../types";

export async function getUserOrCreate(address: string) {
  const id = ethers.utils.getAddress(address);
  let user = await User.get(id);
  if (!user) {
    user = User.create({ id });
    await user.save();
  }
  return user as User;
}
