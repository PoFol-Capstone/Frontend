"use server";

import { acceptApplicant, rejectApplicant } from "@/lib/apply";
import { revalidatePath } from "next/cache";

export async function acceptAction(postUuid: string, applyUuid: string) {
  await acceptApplicant(postUuid, applyUuid);
  revalidatePath("/recruitment");
}

export async function rejectAction(postUuid: string, applyUuid: string) {
  await rejectApplicant(postUuid, applyUuid);
  revalidatePath("/recruitment");
}
