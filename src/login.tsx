import { useState } from "react";
import { Action, ActionPanel, Form } from "@raycast/api";
import { useCachedState } from "@raycast/utils";

import { useAuth } from "@/hooks";

export function Login() {
  const [emailSent] = useCachedState<boolean>("@emailSent");
  const [email, setEmail] = useCachedState<string>("@email");
  const [otp, setOTP] = useState<string>("");
  const [emailError, setEmailError] = useState<string | undefined>();

  const { getOTP, login } = useAuth();

  function dropNameErrorIfNeeded(value?: string) {
    setEmail(value);
    if (emailError && emailError.length > 0) {
      setEmailError(undefined);
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title={emailSent ? "Sign In" : "Send Magic Link"}
            onSubmit={async () =>
              email
                ? emailSent
                  ? await login(email, otp)
                  : await getOTP(email)
                : setEmailError("The field shouldn't be empty!")
            }
          />
        </ActionPanel>
      }
    >
      {emailSent ? (
        <Form.TextField autoFocus id="otp" title="OTP" placeholder="Enter OTP" value={otp} onChange={setOTP} />
      ) : (
        <Form.TextField
          id="email"
          title="Email address"
          placeholder="Enter email address"
          value={email}
          error={emailError}
          onChange={dropNameErrorIfNeeded}
          onBlur={(event) => {
            if (event.target.value?.length == 0) {
              setEmailError("The field should't be empty!");
            } else {
              dropNameErrorIfNeeded(event.target.value);
            }
          }}
        />
      )}
    </Form>
  );
}
