/* AUTH CALLBACK v1 — Google OAuth */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function checarOnboarding() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) {
          navigate("/login", { replace: true });
          return;
        }
        const { data: perfil } = await supabase
          .from("perfis")
          .select("onboarding_ok")
          .eq("id", user.id)
          .single();
        const precisaOnboarding = !(perfil && perfil.onboarding_ok === true);
        navigate(precisaOnboarding ? "/onboarding?origem=google" : "/dashboard", { replace: true });
      } catch {
        navigate("/dashboard", { replace: true });
      }
    }
    checarOnboarding();
  }, [navigate]);

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex items-center justify-center"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <div
        className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
      />
    </div>
  );
}