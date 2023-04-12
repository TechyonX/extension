import { useState } from "react";
import { Action, ActionPanel, Detail, Form, Toast, popToRoot, showToast } from "@raycast/api";
import { useCachedState } from "@raycast/utils";

import { supabase } from "./client";
import { useDB } from "./hooks";
import { ParticleValues, Type, TypeName } from "./types";
import { Login } from "./login";

function FormContent({ type }: { type?: TypeName }) {
  const props = { id: "content", title: "Content" };

  switch (type) {
    case "Link":
      return <Form.TextField {...props} />;
    case "Image":
      return <Form.FilePicker {...props} />;
    case "Text":
    default:
      return <Form.TextArea {...props} />;
  }
}

function CreateForm() {
  const { data, error, isLoading } = useDB<Type[]>("type");
  const [selectedType, setSelectedType] = useState<string>();

  async function onSubmit(values: ParticleValues) {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Creating particle...",
    });

    try {
      const { data } = await supabase.auth.getSession();
      await supabase.from("particle").insert({ ...values, user_id: data?.session?.user?.id });

      toast.style = Toast.Style.Success;
      toast.title = "New particle created";
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = error instanceof Error ? error?.message : "Failed to create a particle";
    }

    popToRoot();
  }

  if (error) return <Login />;
  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={onSubmit} />
        </ActionPanel>
      }
      isLoading={isLoading}
    >
      <Form.Dropdown id="type" title="Type" value={selectedType} onChange={setSelectedType} isLoading>
        {data?.map((type) => (
          <Form.Dropdown.Item key={type.id} value={type.id.toString()} title={type.name} icon={type.emoji} />
        ))}
      </Form.Dropdown>
      {selectedType ? <FormContent type={data?.find((type) => type.id === parseInt(selectedType))?.name} /> : null}
      <Form.Separator />
      <Form.TextField id="title" title="Title" />
      <Form.TextArea id="description" title="Description" />
      <Form.Checkbox id="is_public" title="Public" label="Public" />
    </Form>
  );
}

export default function Create() {
  const [authenticated] = useCachedState<boolean>("authenticated");

  return authenticated ? <CreateForm /> : <Login />;
}
