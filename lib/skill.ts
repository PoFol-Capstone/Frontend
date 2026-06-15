"use server";

import { http } from "./http.server";
import type { Skill } from "@/types/skill";

export async function getSkills(q?: string): Promise<Skill[]> {
  const res = await http.get("/api/skills", q ? { params: { q } } : undefined);
  return res.data;
}
