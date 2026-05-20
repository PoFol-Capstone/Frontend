"use server";

import { deletePost } from "@/lib/post";
import { redirect } from "next/navigation";

export async function deletePostAction(uuid: string) {
  await deletePost(uuid);
  redirect("/board");
}
