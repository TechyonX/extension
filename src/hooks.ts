import { useEffect, useState } from "react";
import { Toast, showToast } from "@raycast/api";
import { Session } from "@supabase/supabase-js";
import { supabase } from "./client";

export function useSession() {
  const [data, setData] = useState<Session>();
  const [error, setError] = useState<Error>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    let ignore = false;

    async function fetch() {
      const { data, error } = await supabase.auth.getSession();

      if (ignore) return;
      if (data) setData(data?.session || undefined);
      if (error) setError(error);
      return setIsLoading(false);
    }

    fetch();

    return () => {
      ignore = true;
    };
  }, []);

  return {
    isAuthenticated:
      data === undefined && error === undefined ? false : data?.user?.aud === "authenticated" ? true : undefined,
    session: data,
    sessionError: error,
    sessionLoading: isLoading,
    sessionUpdate: setData,
  };
}

export function useAuth() {
  const { sessionUpdate, ...sessionData } = useSession();

  async function login(email: string, password: string) {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Signing in...",
    });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (data.session && data.user) {
      sessionUpdate(data.session);
      toast.style = Toast.Style.Success;
      toast.title = "Signed in";
    } else {
      toast.style = Toast.Style.Failure;
      toast.title = error?.message || "Invalid login credentials";
    }
  }

  async function logout() {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Signing out...",
    });

    const { error } = await supabase.auth.signOut();

    if (!error) {
      sessionUpdate(undefined);
      toast.style = Toast.Style.Success;
      toast.title = "Signed out";
    } else {
      toast.style = Toast.Style.Failure;
      toast.title = error?.message || "Could not sign out";
    }
  }

  return { login, logout, ...sessionData };
}

export function useDB<T>(relation: string) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<Error>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    let ignore = false;

    async function fetch() {
      const { data, error } = await supabase.from(relation).select();

      if (ignore) return;
      if (data) setData(data);
      if (error) setError(error);
      return setIsLoading(false);
    }

    fetch();

    return () => {
      ignore = true;
    };
  }, [relation]);

  return { data, error, isLoading };
}
