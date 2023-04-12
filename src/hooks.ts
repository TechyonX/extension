import { useEffect, useState } from "react";
import { Toast, showToast } from "@raycast/api";
import { useCachedState } from "@raycast/utils";
import { PostgrestError, Session, User } from "@supabase/supabase-js";
import { supabase } from "./client";

export function useAuth() {
  const [authenticated, setAuthenticated] = useCachedState<boolean>("authenticated");
  const [data, setData] = useCachedState<User>("@session");
  const [error, setError] = useState<Error>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  async function login(email: string, password: string) {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Signing in...",
    });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (data.session && data.user) {
      setData(data.user);
      setAuthenticated(true);
      toast.style = Toast.Style.Success;
      toast.title = "Signed in";
    } else {
      setData(undefined);
      setAuthenticated(false);
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
      setData(undefined);
      setAuthenticated(false);
      toast.style = Toast.Style.Success;
      toast.title = "Signed out";
    } else {
      toast.style = Toast.Style.Failure;
      toast.title = error?.message || "Could not sign out";
    }
  }

  // useEffect(() => {
  //   setIsLoading(true);
  //   let ignore = false;

  //   async function fetch() {
  //     const { data, error } = await supabase.auth.getSession();

  //     if (ignore) return;
  //     if (data?.session?.user?.aud === "authenticated") {
  //       setData(data.user);
  //       setAuthenticated(true);
  //     }
  //     if (error) {
  //       setError(error);
  //       setAuthenticated(true);
  //     }
  //     return setIsLoading(false);
  //   }

  //   fetch();

  //   return () => {
  //     ignore = true;
  //   };
  // }, []);

  return { login, logout, authenticated, data, error, isLoading };
}

export function useDB<T>(relation: string) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<PostgrestError>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    let ignore = false;

    async function fetch() {
      const { data, error } = await supabase.from(relation).select();

      if (ignore) return;
      if (data) setData(data as T);
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
