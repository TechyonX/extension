import { useState } from "react";
import { Action, ActionPanel, Form, Icon } from "@raycast/api";
import { useCachedState } from "@raycast/utils";

import { useAuth } from "@/hooks";

export function Login() {
  const [email, setEmail] = useCachedState<string>("@email");
  const [otp, setOTP] = useState<string>("");
  const [emailError, setEmailError] = useState<string | undefined>();

  const { otpSent, sendOTP, login } = useAuth();

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            icon={Icon.Envelope}
            title={otpSent ? "Sign In" : "Send Magic Link"}
            onSubmit={async () =>
              email
                ? otpSent
                  ? await login(email, otp)
                  : await sendOTP(email)
                : setEmailError("The field shouldn't be empty!")
            }
          />
        </ActionPanel>
      }
    >
      {otpSent ? (
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
