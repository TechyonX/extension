import crypto from "node:crypto";
import { useEffect, useState } from "react";
import { OAuth, showToast, Toast } from "@raycast/api";
import { PostgrestError, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

global.crypto = crypto;

const google = new OAuth.PKCEClient({
  redirectMethod: OAuth.RedirectMethod.Web,
  providerName: "Google",
  providerIcon: "google-logo.png",
  providerId: "google",
  description: "Connect your Google account",
});

const clientId = "1045722940985-2o9h3tki5ekcaf0pd249r7cssk9b7dtm.apps.googleusercontent.com";
const scopes = "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile";

export async function authorize() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://raycast.com/redirect/extension",
        skipBrowserRedirect: true,
        scopes,
      },
    });

    const authRequest = await google.authorizationRequest({
      endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      clientId,
      scope: scopes,
    });

    console.log(data?.url);
    console.log(authRequest.toURL());

    const url = data?.url ? new URL(data.url) : undefined;
    const authURL = new URL(authRequest.toURL());
    const challenge = url?.searchParams.get("code_challenge");
    const method = url?.searchParams.get("code_challenge_method");
    const raycastURI = authURL.searchParams.get("redirect_uri");

    if (challenge && method && raycastURI) {
      authURL.searchParams.set("code_challenge", challenge);
      authURL.searchParams.set("code_challenge_method", method.toUpperCase());
      authURL.searchParams.set("redirect_to", raycastURI);
      authURL.searchParams.set("redirect_uri", "https://hpiywkenufslzbcpcijs.supabase.co/auth/v1/callback");
    }

    if (error) throw error;
    const { authorizationCode } = await google.authorize({ url: authURL.toString() });
    // const { authorizationCode } = await google.authorize(authRequest);
    return authorizationCode;
  } catch (error) {
    console.log(error);
    return null;
  }
}

export function useAuth() {
  const [data, setData] = useState<User>();

  async function login() {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Signing in...",
    });

    const authorizationCode = await authorize();
    const res = authorizationCode ? await supabase.auth.exchangeCodeForSession(authorizationCode) : null;

    if (res?.data.session && res?.data.user) {
      setData(res.data.user);
      toast.style = Toast.Style.Success;
      toast.title = "Signed in";
    } else {
      setData(undefined);
      toast.style = Toast.Style.Failure;
      toast.title = res?.error?.message || "Could not log in to Particle";
    }
  }

  async function logout() {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Signing out...",
    });

    const { error } = await supabase.auth.signOut();

    if (!error) {
      setData(undefined);
      toast.style = Toast.Style.Success;
      toast.title = "Signed out";
    } else {
      toast.style = Toast.Style.Failure;
      toast.title = error?.message || "Could not sign out";
    }
  }

  return { login, logout, data };
}

export function useDB<T>(relation: string, options?: any) {
  const { orderBy, ascending } = options || { orderBy: "id", ascending: true };
  const [data, setData] = useState<T>();
  const [error, setError] = useState<PostgrestError>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  async function fetch() {
    setIsLoading(true);
    const { data, error } = await supabase.from(relation).select().order(orderBy, { ascending });

    if (data) setData(data as T);
    if (error) setError(error);
    setIsLoading(false);
  }

  useEffect(() => {
    let ignore = false;

    if (!ignore) fetch();

    return () => {
      ignore = true;
    };
  }, [relation]);

  return { data, error, isLoading, mutate: fetch };
}
