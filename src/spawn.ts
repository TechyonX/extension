import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";
import { getSelectedText, showToast, Toast, unstable_AI, getSelectedFinderItems, showHUD } from "@raycast/api";
import mime from "mime-types";

import { supabase } from "./client";
import { isUrl } from "./utils";

async function uploadImage(userId: string, path: string) {
  try {
    const extension = extname(path).toLowerCase();
    const filename = `${crypto.randomBytes(10).toString("hex").split("-")}_${Date.now()}${extension}`;
    const fileBody = readFileSync(path);
    const contentType = mime.contentType(extension);

    if (contentType) {
      const { data, error } = await supabase.storage
        .from("media")
        .upload(`${userId}/${filename}`, fileBody, { contentType });

      if (error) throw error;
      return Promise.resolve({ title: basename(path), content: data.path });
    }
    throw new Error("Not supported file");
  } catch (error) {
    return false;
  }
}

async function insertParticle(userId: string, options: { title: string; content: string }) {
  const { error } = await supabase.from("particle").insert({
    title: options.title || "Image Title",
    description: "Image description will be added soon",
    content: options.content,
    user_id: userId,
    type: 2,
  });
  return error ? false : true;
}

export default async function Spawn() {
  await showHUD("Spawning particle...");
  const toast = await showToast({
    style: Toast.Style.Animated,
    title: "Spawing particle...",
  });

  const { data } = await supabase.auth.getSession();
  const user_id = data?.session?.user?.id;

  if (user_id === undefined) {
    toast.style = Toast.Style.Failure;
    toast.title = "Not authenticated";
    return await showHUD(toast.title);
  }

  try {
    const selectedImages = await getSelectedFinderItems();
    const imageUploadPromises = selectedImages.map(({ path }) => uploadImage(user_id, path));
    const uploadedPaths = await Promise.all(imageUploadPromises);
    const insertParticlePromises = uploadedPaths.map((particle) =>
      typeof particle === "object" ? insertParticle(user_id, particle) : Promise.resolve(false)
    );
    const response = await Promise.all(insertParticlePromises);

    toast.style = Toast.Style.Success;
    toast.title = `Spawned ${response.filter((value) => value).length}/${selectedImages.length} new particle(s)`;
    return await showHUD(toast.title);
  } catch (error) {
    try {
      const selectedText = await getSelectedText();
      const description = await unstable_AI.ask(
        `Summarize the following content, response should not contain newlines, quotes, trailing spaces etc: ${selectedText}`
      );
      const title = await unstable_AI.ask(
        `Create a short, concise title for the following content, response should not contain newlines, quotes, trailing spaces etc: ${selectedText}`
      );
      const defaultValues = {
        title: title.replace(/\s+/g, " ").trim(),
        description: description.replace(/\s+/g, " ").trim(),
        content: selectedText,
        user_id,
      };
      const { error: postgrestError } = await supabase
        .from("particle")
        .insert({ ...defaultValues, type: isUrl(selectedText) ? 1 : 3 });

      if (postgrestError) throw postgrestError;

      toast.style = Toast.Style.Success;
      toast.title = "Spawned new particle successfuly";
      showHUD(toast.title);
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = error instanceof Error ? error?.message : "Failed to spawn new particle";
      return showHUD(toast.title);
    }
  }
}
