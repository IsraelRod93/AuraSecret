"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Heart, Brain, MapPin, Users, ArrowRight } from "lucide-react";
import { CelestialBackground } from "@/components/celestial-background";
import { useTelegram } from "@/components/telegram-provider";

const STEPS = [
  {
    id: "type",
    aura: "Mmm... dime algo, que te llama mas la atencion? Alguien real con quien conectar, o una compania virtual que siempre este disponible para ti?",
    options: [
      { value: "ai", label: "IA", desc: "Siempre disponible, se adapta a ti", icon: Brain },
      { value: "human", label: "Real", desc: "Mujeres reales, conexion autentica", icon: Heart },
      { value: "both", label: "Ambas", desc: "Sorprendeme con lo mejor", icon: Users },
    ],
  },
  {
    id: "age",
    aura: "Interesante eleccion... Y dime, que edad te resulta mas atractiva?",
    options: [
      { value: "18-22", label: "18-22", desc: "Jovenes y espontaneas" },
      { value: "23-27", label: "23-27", desc: "En su mejor momento" },
      { value: "28-35", label: "28-35", desc: "Maduras y seguras" },
      { value: "any", label: "No importa", desc: "La edad es solo un numero" },
    ],
  },
  {
    id: "personality",
    aura: "Siento tu energia... Que tipo de personalidad te hace perder la cabeza?",
    options: [
      { value: "romantica", label: "Romantica", desc: "Dulce, detallista, cariñosa" },
      { value: "aventurera", label: "Aventurera", desc: "Atrevida, espontanea, libre" },
      { value: "intelectual", label: "Intelectual", desc: "Profunda, curiosa, brillante" },
      { value: "juguetona", label: "Juguetona", desc: "Divertida, coqueta, sin filtros" },
    ],
  },
  {
    id: "location",
    aura: "Ultima pregunta... Te importa donde este?",
    options: [
      { value: "cdmx", label: "CDMX", desc: "" },
      { value: "guadalajara", label: "Guadalajara", desc: "" },
      { value: "monterrey", label: "Monterrey", desc: "" },
      { value: "any", label: "No importa", desc: "Donde sea" },
    ],
  },
];

export default function PreferencesPage() {
  const router = useRouter();
  const { appUser } = useTelegram();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const currentStep = STEPS[step];

  const handleSelect = async (value: string) => {
    const newAnswers = { ...answers, [currentStep.id]: value };
    setAnswers(newAnswers);

    if (step < STEPS.length - 1) {
      setStep(prev => prev + 1);
    } else {
      setSaving(true);

      const ageRange = newAnswers.age || "any";
      let ageMin = 18, ageMax = 35;
      if (ageRange === "18-22") { ageMin = 18; ageMax = 22; }
      else if (ageRange === "23-27") { ageMin = 23; ageMax = 27; }
      else if (ageRange === "28-35") { ageMin = 28; ageMax = 35; }

      await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: appUser?.id,
          prefer_type: newAnswers.type,
          age_min: ageMin,
          age_max: ageMax,
          personality_type: newAnswers.personality === 'any' ? null : newAnswers.personality,
          location: newAnswers.location === 'any' ? null : newAnswers.location,
        }),
      }).catch(() => {});

      setTimeout(() => {
        router.push('/gallery?filtered=true');
      }, 1500);
    }
  };

  if (saving) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center">
        <CelestialBackground />
        <motion.div
          className="text-center relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="font-serif text-2xl text-foreground italic">
            Buscando tu conexion perfecta...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <CelestialBackground />

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-8 pb-24">
        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i <= step ? 'bg-primary' : 'bg-border/30'
              }`}
            />
          ))}
        </div>

        {/* Aura message */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-start gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="glass-card rounded-2xl rounded-tl-sm px-5 py-4 flex-1">
                <p className="font-serif text-lg text-foreground/90 italic leading-relaxed">
                  {currentStep.aura}
                </p>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentStep.options.map((opt, i) => (
                <motion.button
                  key={opt.value}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-primary/50 bg-card/30 backdrop-blur-sm transition-all text-left"
                  onClick={() => handleSelect(opt.value)}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {'icon' in opt && opt.icon && (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <opt.icon className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  {!('icon' in opt && opt.icon) && (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-sm">{opt.label}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <span className="font-medium text-foreground">{opt.label}</span>
                    {opt.desc && (
                      <p className="text-muted-foreground text-sm">{opt.desc}</p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
