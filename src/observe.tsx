import { useState } from "react";
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
import { useAuth, useParticles, useTags, useTypes } from "@/hooks";
import { Login } from "@/login";
import { supabase } from "@/supabase";
import { type Tag } from "@/types";
import { getTypeIcon, isUrl } from "@/utils";

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
  const { user, logout } = useAuth();
  const [type, setType] = useState<string>(DEFAULT_CATEGORY);
  const [newTag, setNewTag] = useState<string>();
  const { particles, particlesLoading, particlesRevalidate } = useParticles();
  const { tags, tagsLoading, tagsRevalidate } = useTags();
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
          typeParticles.map((particle) => {
            const particleTags = (particle.particle_tag as { tag: Tag }[]).map(({ tag }) => tag);

            return (
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
                    metadata={
                      <List.Item.Detail.Metadata>
                        {particle.type === 1 && isUrl(particle.content) ? (
                          <List.Item.Detail.Metadata.Link
                            title="Content"
                            target={particle.content}
                            text={particle?.title || "Open Link"}
                          />
                        ) : particle.type === 2 ? (
                          <List.Item.Detail.Metadata.Link
                            title="Image"
                            target={supabase.storage.from("media").getPublicUrl(particle.content).data.publicUrl}
                            text={particle?.title || "View Image"}
                          />
                        ) : (
                          <List.Item.Detail.Metadata.Label title="Description" text={particle.description} />
                        )}
                        <List.Item.Detail.Metadata.Separator />
                        <List.Item.Detail.Metadata.Label
                          title="Visibility"
                          icon={{
                            source: Icon.TwoPeople,
                            tintColor: particle.is_public ? Color.Green : "rgb(128, 128, 128, 0.7)",
                          }}
                          text={particle.is_public ? "Public item" : "Private item"}
                        />
                        <List.Item.Detail.Metadata.Label
                          title="Observability"
                          icon={{
                            source: Icon.Tray,
                            tintColor: particle.is_archived ? Color.Green : "rgb(128, 128, 128, 0.7)",
                          }}
                          text={particle.is_archived ? "Archived item" : "Listed item"}
                        />
                        <List.Item.Detail.Metadata.Separator />
                        <List.Item.Detail.Metadata.Label
                          title="Created at"
                          icon={Icon.Calendar}
                          text={new Date(particle.created_at).toLocaleString()}
                        />
                        <List.Item.Detail.Metadata.Label
                          title="Updated at"
                          icon={Icon.Calendar}
                          text={new Date(particle.updated_at).toLocaleString()}
                        />
                        <List.Item.Detail.Metadata.Separator />
                        <List.Item.Detail.Metadata.TagList title="Tag">
                          {Array.isArray(particle?.particle_tag) && !!particle?.particle_tag.length ? (
                            (particle.particle_tag as { tag: Tag }[]).map(({ tag }) => (
                              <List.Item.Detail.Metadata.TagList.Item
                                key={tag.id}
                                text={`#${tag.name}`}
                                color={tag.color}
                              />
                            ))
                          ) : (
                            <List.Item.Detail.Metadata.TagList.Item text={`No tags`} color={Color.SecondaryText} />
                          )}
                        </List.Item.Detail.Metadata.TagList>
                      </List.Item.Detail.Metadata>
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
                      shortcut={{ modifiers: ["cmd"], key: "o" }}
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
                    <ActionPanel.Submenu
                      icon={Icon.Tag}
                      title="Tag Particle"
                      shortcut={{ modifiers: ["cmd"], key: "t" }}
                      isLoading={tagsLoading}
                      onSearchTextChange={(value) => setNewTag(value.replaceAll(" ", "-"))}
                    >
                      {newTag ? (
                        <Action
                          autoFocus
                          key={0}
                          icon={{ source: Icon.PlusSquare, tintColor: Color.Green }}
                          title={`Create new tag #${newTag}...`}
                          onAction={async () => {
                            const toast = await showToast({
                              style: Toast.Style.Animated,
                              title: "Tagging particle...",
                            });

                            const { data, error: insertTag } = await supabase
                              .from("tag")
                              .insert({
                                name: newTag,
                                color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                                user_id: user?.id,
                              })
                              .select();
                            setNewTag(undefined);

                            if (!data?.length && insertTag) {
                              toast.style = Toast.Style.Failure;
                              toast.title = `Could not tag particle`;
                              return;
                            }

                            const { error } = await supabase
                              .from("particle_tag")
                              .insert({ particle_id: particle.id, tag_id: data[0].id });
                            tagsRevalidate();
                            particlesRevalidate();

                            if (!error) {
                              toast.style = Toast.Style.Success;
                              toast.title = `Particle tagged with #${newTag}`;
                            } else {
                              toast.style = Toast.Style.Failure;
                              toast.title = error?.message || "Could not tag particle";
                            }
                          }}
                        />
                      ) : null}
                      {((tags as Tag[]) || [])
                        .filter((tag) => (newTag ? tag.name.includes(newTag) : true))
                        .map((tag) => {
                          const used = particleTags.find((particleTag) => particleTag.id === tag.id);

                          return (
                            <Action
                              key={tag.id}
                              icon={{ source: used ? Icon.Trash : Icon.Tag, tintColor: used ? Color.Red : Color.Green }}
                              title={tag.name}
                              onAction={async () => {
                                const toast = await showToast({
                                  style: Toast.Style.Animated,
                                  title: used ? "Untagging particle..." : "Tagging particle...",
                                });

                                const method = used
                                  ? supabase
                                      .from("particle_tag")
                                      .delete()
                                      .eq("tag_id", tag.id)
                                      .eq("particle_id", particle.id)
                                  : supabase.from("particle_tag").insert({ particle_id: particle.id, tag_id: tag.id });

                                const { error } = await method;
                                particlesRevalidate();

                                if (!error) {
                                  toast.style = Toast.Style.Success;
                                  toast.title = used
                                    ? `Removed #${tag.name} from particle`
                                    : `Particle tagged with #${tag.name}`;
                                } else {
                                  toast.style = Toast.Style.Failure;
                                  toast.title = error?.message || "Failed to complete";
                                }
                              }}
                            />
                          );
                        })}
                    </ActionPanel.Submenu>
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
            );
          })}
      </List.Section>
    </List>
  );
}

export default function Observe() {
  const { user } = useAuth();

  return user?.aud === "authenticated" ? <Particles /> : <Login />;
}
