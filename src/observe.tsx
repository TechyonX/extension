import { useEffect, useState } from "react";
import {
  Action,
  ActionPanel,
  Alert,
  Color,
  Icon,
  List,
  Toast,
  confirmAlert,
  showToast,
  useNavigation,
} from "@raycast/api";

import { Create } from "@/create";
import { useAuth, useParticles, useTypes } from "@/hooks";
import { Login } from "@/login";
import { supabase } from "@/supabase";
import { getTypeIcon } from "@/utils";

const DEFAULT_CATEGORY = "null";

function Types({ onTypeChange }: { onTypeChange: (changedType: string) => void }) {
  const { types, typesLoading } = useTypes();

  return !typesLoading ? (
    <List.Dropdown defaultValue={DEFAULT_CATEGORY} onChange={onTypeChange} tooltip="Select Category" storeValue>
      <List.Dropdown.Item key={"0"} icon={Icon.AppWindowGrid3x3} title="All types" value={DEFAULT_CATEGORY} />
      <List.Dropdown.Section>
        {types?.length &&
          types.map((type) => (
            <List.Dropdown.Item
              key={type.id}
              icon={getTypeIcon(type.id)}
              title={type.name}
              value={type.id.toString()}
            />
          ))}
      </List.Dropdown.Section>
    </List.Dropdown>
  ) : null;
}

function Particles() {
  const { logout } = useAuth();
  const [type, setType] = useState<string>(DEFAULT_CATEGORY);
  const { particles, particlesLoading, particlesRevalidate } = useParticles();
  const { push } = useNavigation();

  const typeParticles =
    type === DEFAULT_CATEGORY ? particles : particles?.filter((particle) => particle.type === parseInt(type));

  function onTypeChange(newCategory: string) {
    type !== newCategory && setType(newCategory);
  }

  return (
    <List searchBarAccessory={<Types onTypeChange={onTypeChange} />} isLoading={particlesLoading} isShowingDetail>
      <List.EmptyView title="No particle exists" description="Any particles you have created will be listed here." />
      <List.Section title="Particles" subtitle={`${particles?.length}`}>
        {typeParticles?.length &&
          typeParticles.map((particle) => (
            <List.Item
              key={particle.id}
              icon={{ value: getTypeIcon(particle.type, particle.content), tooltip: `#${particle.id}` }}
              id={particle.id}
              title={{ value: particle.title || particle.content, tooltip: particle.title }}
              accessories={[
                {
                  icon: {
                    source: Icon.TwoPeople,
                    tintColor: particle.is_public ? Color.Green : "rgb(128, 128, 128, 0.7)",
                  },
                  tooltip: particle.is_public ? "Public item" : "Private item",
                },
                {
                  icon: {
                    source: Icon.Tray,
                    tintColor: particle.is_archived ? Color.Green : "rgb(128, 128, 128, 0.7)",
                  },
                  tooltip: particle.is_archived ? "Archived item" : "Listed item",
                },
                {
                  tag: {
                    value: new Date(Date.parse(particle.created_at)),
                  },
                },
              ]}
              detail={
                <List.Item.Detail
                  markdown={
                    particle.type === 2
                      ? `![${particle.title}](${
                          supabase.storage.from("media").getPublicUrl(particle.content).data.publicUrl
                        })`
                      : particle.content
                  }
                />
              }
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard content={particle.content} />
                  <Action.Paste icon={Icon.TextCursor} content={particle.content} />
                  <ActionPanel.Section />
                  <Action
                    icon={Icon.TwoPeople}
                    title="Toggle Publish"
                    shortcut={{ modifiers: ["cmd"], key: "t" }}
                    onAction={async () => {
                      const toast = await showToast({
                        style: Toast.Style.Animated,
                        title: particle.is_public ? "Unpublishing particle..." : "Publishing particle...",
                      });
                      const { error } = await supabase
                        .from("particle")
                        .update({ is_public: !particle.is_public })
                        .eq("id", particle.id);
                      particlesRevalidate();
                      if (!error) {
                        toast.style = Toast.Style.Success;
                        toast.title = `Particle ${particle.is_public ? "is private" : "is public"}`;
                      } else {
                        toast.style = Toast.Style.Failure;
                        toast.title = error?.message || "Could not respawn particle";
                      }
                    }}
                  />
                  <Action
                    icon={Icon.Tray}
                    title="Toggle Archive"
                    shortcut={{ modifiers: ["cmd"], key: "h" }}
                    onAction={async () => {
                      const toast = await showToast({
                        style: Toast.Style.Animated,
                        title: particle.is_archived ? "Unarchiving particle..." : "Archiving particle...",
                      });
                      const { error } = await supabase
                        .from("particle")
                        .update({ is_archived: !particle.is_archived })
                        .eq("id", particle.id);
                      particlesRevalidate();
                      if (!error) {
                        toast.style = Toast.Style.Success;
                        toast.title = `Particle ${particle.is_archived ? "is listed" : "is archived"}`;
                      } else {
                        toast.style = Toast.Style.Failure;
                        toast.title = error?.message || "Could not respawn particle";
                      }
                    }}
                  />
                  <Action
                    icon={Icon.Pencil}
                    title="View Particle"
                    shortcut={{ modifiers: ["cmd"], key: "e" }}
                    onAction={() => console.log("View")}
                  />
                  <Action
                    icon={Icon.PlusSquare}
                    title="Spawn Particle"
                    shortcut={{ modifiers: ["cmd"], key: "n" }}
                    onAction={() => push(<Create />)}
                  />
                  <ActionPanel.Section />
                  <Action
                    icon={Icon.Trash}
                    title="Destroy Particle"
                    shortcut={{ modifiers: ["ctrl"], key: "x" }}
                    onAction={async () => {
                      if (
                        await confirmAlert({
                          title: `Destroy Particle`,
                          message:
                            "The fate of the universe may depend on this particular particle you are about to destroy. Should we procedd?",
                          primaryAction: { title: "Destroy", style: Alert.ActionStyle.Destructive },
                        })
                      ) {
                        const toast = await showToast({
                          style: Toast.Style.Animated,
                          title: "Destroying particle...",
                        });
                        const { error } = await supabase.from("particle").delete().eq("id", particle.id);
                        particlesRevalidate();

                        if (!error) {
                          toast.style = Toast.Style.Success;
                          toast.title = "Particle destroyed";
                        } else {
                          toast.style = Toast.Style.Failure;
                          toast.title = error?.message || "Could not destroy particle";
                        }
                      }
                    }}
                  />
                  <Action
                    icon={Icon.Logout}
                    title="Logout"
                    shortcut={{ modifiers: ["ctrl"], key: "q" }}
                    onAction={async () => {
                      if (
                        await confirmAlert({
                          title: `Logout`,
                          message: "You are about to logout. Should we procedd?",
                          primaryAction: { title: "Logout", style: Alert.ActionStyle.Destructive },
                        })
                      ) {
                        await logout();
                      }
                    }}
                  />
                </ActionPanel>
              }
            />
          ))}
      </List.Section>
    </List>
  );
}

export default function Observe() {
  const { user } = useAuth();

  return user?.aud === "authenticated" ? <Particles /> : <Login />;
}
