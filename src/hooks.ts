import { useEffect, useState } from "react";
import { Toast, showToast } from "@raycast/api";
import { useCachedState } from "@raycast/utils";
import { PostgrestError, User } from "@supabase/supabase-js";
import { supabase } from "./client";

export function useAuth() {
  const [data, setData] = useCachedState<User>("@user");

  async function login(email: string, password: string) {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Signing in...",
    });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (data.session && data.user) {
      setData(data.user);
      toast.style = Toast.Style.Success;
      toast.title = "Signed in";
    } else {
      setData(undefined);
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
