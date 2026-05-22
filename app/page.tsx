"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { AuraChat } from "@/components/aura-chat";

const WELCOME_KEY = "aura_welcome_done";

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(WELCOME_KEY)) {
        router.replace("/welcome");
        return;
      }
      setReady(true);
    } catch {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Sparkles className="text-primary animate-pulse" size={28} />
      </div>
    );
  }

  return <AuraChat />;
}
