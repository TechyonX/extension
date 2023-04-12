import { useState } from "react";
import { Icon, List } from "@raycast/api";

import { useDB } from "./hooks";
import { Particle, Type } from "./types";
import { Login } from "./login";
import { useCachedState } from "@raycast/utils";

const DEFAULT_CATEGORY = "null";

function Types({ onTypeChange }: { onTypeChange: (changedType: string) => void }) {
  const { data, isLoading } = useDB<Type[]>("type");

  return !isLoading ? (
    <List.Dropdown defaultValue={DEFAULT_CATEGORY} onChange={onTypeChange} tooltip="Select Category" storeValue>
      <List.Dropdown.Item key={"0"} icon={Icon.AppWindowGrid3x3} title="All types" value={DEFAULT_CATEGORY} />
      {data?.length &&
        data.map((type) => (
          <List.Dropdown.Item key={type.id} icon={type.emoji} title={type.name} value={type.id.toString()} />
        ))}
    </List.Dropdown>
  ) : null;
}

function Particles() {
  const [type, setType] = useState<string>(DEFAULT_CATEGORY);
  const { data, isLoading } = useDB<Particle[]>("particle");

  const typeParticles = type === DEFAULT_CATEGORY ? data : data?.filter((particle) => particle.type === parseInt(type));

  const onTypeChange = (newCategory: string) => {
    type !== newCategory && setType(newCategory);
  };

  return (
    <List searchBarAccessory={<Types onTypeChange={onTypeChange} />} isLoading={isLoading}>
      <List.EmptyView title="No particle exists" description="Any particles you have created will be listed here." />
      <List.Section title="Particles" subtitle={`${data?.length}`}>
        {typeParticles?.length &&
          typeParticles.map((particle) => (
            <List.Item key={particle.id} id={particle.id} title={particle.content} subtitle={particle.content} />
          ))}
      </List.Section>
    </List>
  );
}

export default function Observe() {
  const [authenticated] = useCachedState<boolean>("authenticated");

  return authenticated ? <Particles /> : <Login />;
}
