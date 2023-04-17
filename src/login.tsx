import { useState } from "react";
import { Action, ActionPanel, Form, Icon } from "@raycast/api";
import { useCachedState } from "@raycast/utils";

import { useAuth } from "@/hooks";

export function Login() {
  const [emailSent] = useCachedState<boolean>("@emailSent");
  const [email, setEmail] = useCachedState<string>("@email");
  const [otp, setOTP] = useState<string>("");
  const [emailError, setEmailError] = useState<string | undefined>();

  const { getOTP, login } = useAuth();

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            icon={Icon.Envelope}
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
          onChange={(newValue) => {
            if (newValue.length > 0) setEmail(undefined);
            setEmail(newValue);
          }}
          onBlur={(event) => {
            if (event.target.value?.length == 0) {
              setEmailError("The field should't be empty!");
            } else {
              setEmailError(undefined);
            }
          }}
        />
      )}
    </Form>
  );
}
