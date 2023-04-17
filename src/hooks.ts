import { useState } from "react";
import { Crypto } from "@peculiar/webcrypto";
import { LocalStorage, showToast, Toast } from "@raycast/api";
import { useCachedPromise, usePromise } from "@raycast/utils";
import { isAuthError } from "@supabase/supabase-js";

import { supabase } from "@/supabase";

const crypto = new Crypto();
global.crypto = crypto;

export function useAuth() {
  const [otpSent, setOTPSent] = useState<boolean>();

  const { data, error, isLoading, revalidate } = useCachedPromise(async () => {
    const res = await supabase.auth.getUser();
    return res.data.user;
  });

  async function sendOTP(email: string) {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Sending magic link...",
    });

    if (otpSent) {
      toast.style = Toast.Style.Success;
      toast.title = "Magic link is sent. Please check your email.";
      return;
    }

    const res = await supabase.auth.signInWithOtp({ email });
    revalidate();

    if (res.error) {
      toast.style = Toast.Style.Failure;
      toast.title = res.error?.message || "Could not send a magic link";
      return setOTPSent(false);
    }
    if (res.data) {
      toast.style = Toast.Style.Success;
      toast.title = "Magic link is sent";
      return setOTPSent(true);
    }
  }

  async function login(email: string, otp: string) {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Signing in...",
    });

    const res = await supabase.auth.verifyOtp({ email, token: otp, type: "magiclink" });
    revalidate();

    if (res.data.user && res.data.user.aud === "authenticated") {
      toast.style = Toast.Style.Success;
      toast.title = "Signed in";
    }

    if (res.error && isAuthError(res.error)) {
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
    await LocalStorage.clear();

    if (!error) {
      toast.style = Toast.Style.Success;
      toast.title = "Signed out";
    } else {
      toast.style = Toast.Style.Failure;
      toast.title = error?.message || "Could not sign out";
    }
  }

  return { user: data, error, isLoading, otpSent, sendOTP, login, logout };
}

export function useParticles() {
  const { data, error, isLoading, revalidate } = usePromise(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const { data, error } = await supabase
      .from("particle")
      .select()
      .eq("user_id", sessionData.session?.user.id)
      .eq("is_trashed", false)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  });

  return {
    particles: data,
    particlesError: error,
    particlesLoading: isLoading,
    particlesRevalidate: revalidate,
  };
}

export function useTypes() {
  const { data, error, isLoading, revalidate } = usePromise(async () => {
    const { data, error } = await supabase.from("type").select().order("id", { ascending: true });

    if (error) throw error;
    return data;
  });

  return {
    types: data,
    typesError: error,
    typesLoading: isLoading,
    typesRevalidate: revalidate,
  };
}
