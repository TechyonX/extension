import { useState } from "react";
import { Action, ActionPanel, Alert, Color, Icon, List, Toast, confirmAlert, showToast } from "@raycast/api";
import { useCachedState } from "@raycast/utils";
import { User } from "@supabase/supabase-js";

import { supabase } from "./client";
import { useDB } from "./hooks";
import { Particle, Type } from "./types";
import { Login } from "./login";
import { getTypeIcon } from "./utils";

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
  const [type, setType] = useState<string>(DEFAULT_CATEGORY);
  const { data, isLoading, mutate } = useDB<Particle[]>("particle");

  const typeParticles = type === DEFAULT_CATEGORY ? data : data?.filter((particle) => particle.type === parseInt(type));

  function onTypeChange(newCategory: string) {
    type !== newCategory && setType(newCategory);
  }

  return (
    <List searchBarAccessory={<Types onTypeChange={onTypeChange} />} isLoading={isLoading}>
      <List.EmptyView title="No particle exists" description="Any particles you have created will be listed here." />
      <List.Section title="Particles" subtitle={`${data?.length}`}>
        {typeParticles?.length &&
          typeParticles.map((particle) => (
            <List.Item
              key={particle.id}
              icon={{ value: getTypeIcon(particle.type, particle.content), tooltip: `#${particle.id}` }}
              id={particle.id}
              title={{ value: particle.title || particle.content, tooltip: particle.title }}
              subtitle={particle.description}
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
              actions={
                <ActionPanel>
                  <ActionPanel.Section />
                  <Action
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
                        mutate();
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
                </ActionPanel>
              }
            />
          ))}
      </List.Section>
    </List>
  );
}

export default function Observe() {
  const [user] = useCachedState<User>("@user");

  return user?.aud === "authenticated" ? <Particles /> : <Login />;
}
