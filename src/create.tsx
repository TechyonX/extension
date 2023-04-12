import crypto from "node:crypto";
import { useState } from "react";
import { Action, ActionPanel, Form, Toast, popToRoot, showToast, unstable_AI } from "@raycast/api";
import { useCachedState } from "@raycast/utils";
import { User } from "@supabase/supabase-js";

import { supabase } from "./client";
import { useDB } from "./hooks";
import { Login } from "./login";
import { ParticleValues, Type, TypeName } from "./types";
import { getTypeIcon } from "./utils";

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
  const [user] = useCachedState<User>("@user");
  const [selectedType, setSelectedType] = useState<string>();
  const { data, error, isLoading } = useDB<Type[]>("type");

  async function onSubmit(values: ParticleValues) {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Creating particle...",
    });

    try {
      if (values.type === "2" && Array.isArray(values.content) && values.content.length === 1) {
        const contentPath = values.content[0];
        const filename = `${crypto.randomBytes(10).toString("hex").split("-")}_${Date.now()}`;
        const extension = `${contentPath.split(".").pop()}`;
        const { data, error: storageError } = await supabase.storage
          .from("media")
          .upload(`${user?.id}/${filename}.${extension}`, values.content[0]);
        if (storageError) throw storageError;

        values = {
          ...values,
          content: data.path,
          title: "Image Content Title",
          description: "Image content summary goes",
        };
      } else {
        const description = await unstable_AI.ask(
          `Summarize the following content, response should not contain newlines, quotes, trailing spaces etc: ${values.content}`
        );
        const title = await unstable_AI.ask(
          `Create a short, concise title for the following content, response should not contain newlines, quotes, trailing spaces etc: ${values.content}`
        );
        values = {
          ...values,
          title: title.replace(/\s+/g, " ").trim(),
          description: description.replace(/\s+/g, " ").trim(),
        };
      }

      const { error: postgrestError } = await supabase.from("particle").insert({ ...values, user_id: user?.id });
      if (postgrestError) throw postgrestError;

      toast.style = Toast.Style.Success;
      toast.title = "New particle created";
      popToRoot();
    } catch (error) {
      console.log(error);
      toast.style = Toast.Style.Failure;
      toast.title = error instanceof Error ? error?.message : "Failed to create a particle";
    }
  }

  if (error) return <Login />;
  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Particle" onSubmit={onSubmit} />
        </ActionPanel>
      }
      isLoading={isLoading}
    >
      <Form.Dropdown id="type" title="Type" value={selectedType} onChange={setSelectedType} isLoading>
        {data?.map((type) => (
          <Form.Dropdown.Item key={type.id} value={type.id.toString()} title={type.name} icon={getTypeIcon(type.id)} />
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
  const [user] = useCachedState<User>("@user");

  return user?.aud === "authenticated" ? <CreateForm /> : <Login />;
}
