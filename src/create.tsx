import { useState } from "react";
import { Action, ActionPanel, Form, Toast, showToast, unstable_AI, useNavigation } from "@raycast/api";
import { useCachedState } from "@raycast/utils";
import { User } from "@supabase/supabase-js";

import { useDB } from "@/hooks";
import { Login } from "@/login";
import { supabase } from "@/supabase";
import { ParticleValues, Type, TypeName } from "@/types";
import { getTypeIcon, isUrl, uploadImage } from "@/utils";

function FormContent({ type, props }: { type?: TypeName; props?: any }) {
  const extendedProps = { id: "content", title: "Content", ...props };

  switch (type) {
    case "Link":
      return <Form.TextField {...extendedProps} />;
    case "Image":
      return <Form.FilePicker {...extendedProps} allowMultipleSelection={false} />;
    case "Text":
    default:
      return <Form.TextArea {...extendedProps} enableMarkdown />;
  }
}

export function Create() {
  const [user] = useCachedState<User>("@user");
  const [contentError, setContentError] = useState<string>();
  const [selectedType, setSelectedType] = useState<string>();
  const { data, error, isLoading } = useDB<Type[]>("type");
  const { pop } = useNavigation();

  function dropContentErrorIfNeeded() {
    if (contentError && contentError.length > 0) {
      setContentError(undefined);
    }
  }

  function contentErrorValidation(event: any) {
    const value = event.target.value;

    if (value && value.length > 0) {
      if (selectedType === "1" && !isUrl(value)) {
        setContentError("The field is not a valid URL!");
      } else {
        dropContentErrorIfNeeded();
      }
    } else {
      setContentError("The field should't be empty!");
    }
  }

  async function onSubmit(values: ParticleValues) {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Spawing particle...",
    });

    if (!user) {
      toast.style = Toast.Style.Failure;
      toast.title = "Not authenticated";
      return pop();
    }

    if (!values.content || values.content.length === 0) {
      toast.style = Toast.Style.Failure;
      toast.title = "The content field shouldn't be empty!";
      return setContentError("The field should't be empty!");
    }

    try {
      if (values.type === "2" && Array.isArray(values.content)) {
        const res = await uploadImage(user.id, values.content[0]);
        if (!res) throw "Failed to upload the image";

        values = {
          ...values,
          content: res.content,
          title: res.title || "Image Content Title",
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

      const { error: postgrestError } = await supabase
        .from("particle")
        .insert({ ...values, type: parseInt(values.type), user_id: user.id });
      if (postgrestError) throw postgrestError;

      toast.style = Toast.Style.Success;
      toast.title = "Spawned new particle";
      pop();
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = error instanceof Error ? error?.message : "Failed to spawn new particle";
    }
  }

  if (error) return <Login />;
  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Spawn Particle" onSubmit={onSubmit} />
        </ActionPanel>
      }
      isLoading={isLoading}
    >
      <Form.Dropdown id="type" title="Type" value={selectedType} onChange={setSelectedType} isLoading>
        {data?.map((type) => (
          <Form.Dropdown.Item key={type.id} value={type.id.toString()} title={type.name} icon={getTypeIcon(type.id)} />
        ))}
      </Form.Dropdown>
      {selectedType ? (
        <FormContent
          type={data?.find((type) => type.id === parseInt(selectedType))?.name}
          props={{ error: contentError, onChange: dropContentErrorIfNeeded, onBlur: contentErrorValidation }}
        />
      ) : null}
      <Form.Separator /> 
      <Form.TextField id="title" title="Title" />
      <Form.TextArea id="description" title="Description" />
      <Form.Checkbox id="is_public" title="Public" label="Public" />
    </Form>
  );
}
