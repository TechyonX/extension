import { useState } from "react";
import { Action, ActionPanel, Form } from "@raycast/api";

import { useAuth } from "./hooks";

export function Login() {
  const [email, setEmail] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const { login } = useAuth();

  function dropNameErrorIfNeeded() {
    if (email && email.length > 0) {
      setEmail(undefined);
    }
  }

  function dropPasswordErrorIfNeeded() {
    if (passwordError && passwordError.length > 0) {
      setPasswordError(undefined);
    }
  }

  async function onSubmit(values: { email: string; password: string }) {
    await login(values.email, values.password);
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Sign In" onSubmit={onSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="email"
        title="Email address"
        placeholder="Enter email address"
        error={email}
        onChange={dropNameErrorIfNeeded}
        onBlur={(event) => {
          if (event.target.value?.length == 0) {
            setEmail("The field should't be empty!");
          } else {
            dropNameErrorIfNeeded();
          }
        }}
      />
      <Form.PasswordField
        id="password"
        title="Password"
        placeholder="Enter password"
        error={passwordError}
        onChange={dropPasswordErrorIfNeeded}
        onBlur={(event) => {
          const value = event.target.value;
          if (value && value.length > 0) {
            dropPasswordErrorIfNeeded();
          } else {
            setPasswordError("The field should't be empty!");
          }
        }}
      />
    </Form>
  );
}
