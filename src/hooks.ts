import { useEffect, useState } from "react";
import { OAuth, showToast, Toast } from "@raycast/api";
import { PostgrestError, User } from "@supabase/supabase-js";

import { supabase } from "./supabase";

const google = new OAuth.PKCEClient({
  redirectMethod: OAuth.RedirectMethod.Web,
  providerName: "Google",
  providerIcon: "google-logo.png",
  providerId: "google",
  description: "Connect your Google account",
});

export async function authorize() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://raycast.com/redirect/extension",
        scopes: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
        skipBrowserRedirect: true,
      },
    });
    console.log(data.url);
    if (error) throw error;
    const { authorizationCode } = await google.authorize({ url: data.url });
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
