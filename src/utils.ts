import crypto from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { basename, extname } from "node:path";
import { Icon, Image } from "@raycast/api";
import { getFavicon } from "@raycast/utils";
import mime from "mime-types";

import { TypeID } from "./types";
import { supabase } from "./client";

export function getTypeIcon(type: TypeID, content?: string) {
  switch (type) {
    case 1:
      return content ? getFavicon(content, { mask: Image.Mask.Circle }) : Icon.Link;
    case 2:
      return Icon.Image;
    case 3:
      return Icon.Bubble;
    default:
      return Icon.Document;
  }
}

export function isUrl(url: string) {
  try {
    const urlObject = new URL(url);
    return urlObject.protocol === "http:" || urlObject.protocol === "https:";
  } catch (err) {
    return false;
  }
}

export async function uploadImage(userId: string, path: string) {
  try {
    const extension = extname(path).toLowerCase();
    const filename = `${crypto.randomBytes(10).toString("hex").split("-")}_${Date.now()}${extension}`;
    const fileBody = readFileSync(path);
    const stat = lstatSync(path).isFile();
    const contentType = mime.contentType(extension);

    if (stat && contentType) {
      const { data, error } = await supabase.storage
        .from("media")
        .upload(`${userId}/${filename}`, fileBody, { contentType });

      if (error) throw error;
      return { title: basename(path), content: data.path };
    }
    throw new Error("Not supported file");
  } catch (error) {
    return false;
  }
}
