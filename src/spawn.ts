import crypto from "node:crypto";
import { getSelectedText, showToast, Toast, unstable_AI, getSelectedFinderItems } from "@raycast/api";

import { supabase } from "./client";
import { isUrl } from "./utils";

async function uploadImage(userId: string, path: string) {
  const filename = `${crypto.randomBytes(10).toString("hex").split("-")}_${Date.now()}`;
  const extension = `${path.split(".").pop()}`;
  const { data, error } = await supabase.storage.from("media").upload(`${userId}/${filename}.${extension}`, path);

  return data?.path || error;
}

async function insertParticle(userId: string, path: string) {
  const { error } = await supabase.from("particle").insert({
    title: "Image Title",
    description: "Image description will be added soon",
    content: path,
    user_id: userId,
    type: 2,
  });
  return error ? false : true;
}

export default async function Spawn() {
  const toast = await showToast({
    style: Toast.Style.Animated,
    title: "Spawing particle...",
  });

  const { data } = await supabase.auth.getSession();
  const user_id = data?.session?.user?.id;

  if (user_id === undefined) {
    toast.style = Toast.Style.Failure;
    toast.title = "Not authenticated";
  } else {
    try {
      const selectedImages = await getSelectedFinderItems();
      const imageUploadPromises = selectedImages.map(({ path }) => uploadImage(user_id, path));
      const uploadedPaths = await Promise.all(imageUploadPromises);
      const insertParticlePromises = uploadedPaths.map((path) =>
        typeof path === "string" ? insertParticle(user_id, path) : Promise.resolve(false)
      );
      const response = await Promise.all(insertParticlePromises);

      toast.style = Toast.Style.Success;
      toast.title = `Spawned ${response.filter((value) => value).length}/${
        selectedImages.length
      } new particle(s) successfuly`;
    } catch (error) {
      console.log(String(error));
    }

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

      if (postgrestError) {
        throw postgrestError;
      } else {
        toast.style = Toast.Style.Success;
        toast.title = "Spawned new particle successfuly";
      }
    } catch (error) {
      console.log(error);
      toast.style = Toast.Style.Failure;
      toast.title = error instanceof Error ? error?.message : "Failed to spawn new particle";
    }
  }
}
