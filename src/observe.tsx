import { useState } from "react";
import { Color, Icon, List } from "@raycast/api";
import { useCachedState } from "@raycast/utils";
import { User } from "@supabase/supabase-js";

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
  const { data, isLoading } = useDB<Particle[]>("particle");

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
              title={particle.title || particle.content}
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
