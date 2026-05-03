import { Profile } from "@/types/user";
import { http } from "./http";

export default async function getUser(uuid: string): Promise<Profile> {
  const res = await http.get(`/api/user/${uuid}`);

  return res.data;
}
