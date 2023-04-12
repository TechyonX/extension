import { Icon, Image } from "@raycast/api";
import { getFavicon } from "@raycast/utils";

import { TypeID } from "./types";

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
