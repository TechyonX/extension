import { useState } from "react";
import { Action, ActionPanel, Alert, Color, Icon, List, Toast, confirmAlert, showToast } from "@raycast/api";

import { Create } from "./create";
import { supabase } from "./supabase";
import { useAuth, useDB } from "./hooks";
import { Login } from "./login";
import { Particle, Type } from "./types";
import { getTypeIcon } from "./utils";
import { useCachedState } from "@raycast/utils";
import { User } from "@supabase/supabase-js";

const DEFAULT_CATEGORY = "null";

function Types({ onTypeChange }: { onTypeChange: (changedType: string) => void }) {
  const { data, isLoading } = useDB<Type[]>("type");

  return !isLoading ? (
    <List.Dropdown defaultValue={DEFAULT_CATEGORY} onChange={onTypeChange} tooltip="Select Category" storeValue>
      <List.Dropdown.Item key={"0"} icon={Icon.AppWindowGrid3x3} title="All types" value={DEFAULT_CATEGORY} />
      <List.Dropdown.Section>
        {data?.length &&
          data.map((type) => (
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
  const { data, isLoading, mutate } = useDB<Particle[]>("particle", { orderBy: "updated_at", ascending: false });
  const { push } = useNavigation();

  const typeParticles = type === DEFAULT_CATEGORY ? data : data?.filter((particle) => particle.type === parseInt(type));

  function onTypeChange(newCategory: string) {
    type !== newCategory && setType(newCategory);
  }

  return (
    <List searchBarAccessory={<Types onTypeChange={onTypeChange} />} isLoading={isLoading} isShowingDetail>
      <List.EmptyView title="No particle exists" description="Any particles you have created will be listed here." />
      <List.Section title="Particles" subtitle={`${data?.length}`}>
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
                      mutate();
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
                      mutate();
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
                        const toast = await showToast({
                          style: Toast.Style.Animated,
                          title: "Logging out...",
                        });

                        await logout();
                        toast.style = Toast.Style.Success;
                        toast.title = "Logged out";
                      }
                    }}
                  />
                  <Action
                    icon={Icon.Trash}
                    title="Destroy Particle"
                    shortcut={{ modifiers: ["ctrl"], key: "x" }}
                    onAction={async () => await logout()}
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
  const [data] = useCachedState<User>("@user");

  return data?.aud === "authenticated" ? <Particles /> : <Login />;
}
