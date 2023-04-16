import { useEffect, useState } from "react";
import { showToast, Toast } from "@raycast/api";
import { PostgrestError, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { useCachedState } from "@raycast/utils";

import crypto from "node:crypto";
global.crypto = crypto;

export function useAuth() {
  const [data, setData] = useCachedState<User>("@user");
  const [emailSent, setEmailSent] = useCachedState<boolean>("@emailSent");

  async function getOTP(email: string) {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Sending magic link...",
    });

    const res = !emailSent ? await supabase.auth.signInWithOtp({ email }) : { data: null, error: null };

    if (res?.error) {
      setData(undefined);
      toast.style = Toast.Style.Failure;
      toast.title = res.error?.message || "Could not send a magic link";
      return setEmailSent(false);
    } else {
      toast.style = Toast.Style.Success;
      toast.title = "Magic link is sent";
      return setEmailSent(true);
    }
  }

  async function login(email: string, otp: string) {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Signing in...",
    });

    const res = await supabase.auth.verifyOtp({ email, token: otp, type: "magiclink" });

    if (res?.data.session && res?.data.user) {
      setData(res.data.user);
      setEmailSent(false);
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
      setEmailSent(undefined);
      toast.style = Toast.Style.Success;
      toast.title = "Signed out";
    } else {
      toast.style = Toast.Style.Failure;
      toast.title = error?.message || "Could not sign out";
    }
  }

  return { getOTP, login, logout, data };
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
