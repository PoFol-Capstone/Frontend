import { http } from "./http";

export default async function getUser(uuid: string): Promise<Profile> {
  const res = await http.get(`/user/${uuid}`);

  return res.data;
}
