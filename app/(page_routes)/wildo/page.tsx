"use client";

import DynamicHeroHeader from "@/app/components/sections/DynamicHeroHeader";
import { useLanguage } from "@/lib/LanguageContext";
import {
  BookOpen,
  Heart,
  Images,
  Leaf,
  ShieldCheck,
  Sparkles,
  Stars,
  TreePine,
  Users,
} from "lucide-react";
import Image from "next/image";

const galleryImages = [
  { src: "/wildo/wildo1.png", alt: "Wildo la mascota" },
  { src: "/wildo/20202928-bec8-43d4-8bae-3adb0558a777.jpg", alt: "Wildo en el bosque" },
  { src: "/wildo/711B2B28-4B16-4DBA-93E9-2A9857A96F44.png", alt: "Wildo aventura" },
  { src: "/wildo/7C8110E6-8C44-4F17-9D9A-74BBC675383D.png", alt: "Wildo naturaleza" },
  { src: "/wildo/9F7659E0-F26F-46D0-9E1D-C098545068BE.png", alt: "Wildo selva" },
  { src: "/wildo/A5A02B7D-2B4E-4AA1-A6A9-CDF9AF990F0A.png", alt: "Wildo guardián" },
  { src: "/wildo/Adventures in the Verdant Canyon.jpg", alt: "Aventuras en el cañón" },

];

const content = {
  es: {
    badge: "Conoce a Wildo",
    title: "Wildo, nuestra mascota y guía sabia del bosque mágico",
    intro:
      "Wildo es el amigo oficial de La Vieja Adventures: una mascota curiosa, valiente y amable que acompaña a niñas y niños en una aventura inolvidable por el bosque lluvioso.",
    missionTitle: "Misión de Wildo",
    mission:
      "Guiar a cada familia por senderos llenos de magia para aprender a cuidar la selva tropical, respetar los animales y proteger las fuentes de agua que dan vida al bosque.",
    traitsTitle: "¿Qué hace especial a Wildo?",
    traits: [
      "Es un guía paciente que explica la naturaleza de forma divertida.",
      "Enseña a observar aves, insectos, ríos y árboles sin dañar su hábitat.",
      "Anima a niñas y niños a convertirse en guardianes del bosque.",
      "Comparte historias mágicas que conectan aventura, ciencia y conservación.",
    ],
    learningTitle: "Lo que aprenderán los niños con Wildo",
    learning: [
      "Cómo funciona el ecosistema del bosque lluvioso.",
      "Por qué los árboles son claves para el agua, el clima y la vida silvestre.",
      "Pequeñas acciones diarias para reducir basura y proteger la naturaleza.",
      "Valores como respeto, trabajo en equipo, empatía y responsabilidad ambiental.",
    ],
    promiseTitle: "Promesa de Wildo",
    promise:
      "Cada paso en el bosque mágico es una oportunidad para descubrir, soñar y proteger. Wildo guía a los niños para que regresen a casa con nuevos conocimientos y el corazón lleno de amor por la selva.",
    cta: "¡Únete a Wildo y conviértete en guardián de la selva tropical!",
  },
  en: {
    badge: "Meet Wildo",
    title: "Wildo, our mascot and wise guide through the magic forest",
    intro:
      "Wildo is La Vieja Adventures' official friend: a curious, brave, and kind mascot who guides kids through an unforgettable rainforest adventure.",
    missionTitle: "Wildo's mission",
    mission:
      "Guide each family through magical rainforest trails to learn how to care for the jungle, respect wildlife, and protect the water sources that give life to the forest.",
    traitsTitle: "What makes Wildo special?",
    traits: [
      "A patient guide who explains nature in a fun and simple way.",
      "Teaches children how to observe birds, insects, rivers, and trees without harming their habitat.",
      "Inspires kids to become rainforest guardians.",
      "Shares magical stories that connect adventure, science, and conservation.",
    ],
    learningTitle: "What children will learn with Wildo",
    learning: [
      "How the rainforest ecosystem works.",
      "Why trees are essential for water, climate, and wildlife.",
      "Small daily actions to reduce waste and protect nature.",
      "Values like respect, teamwork, empathy, and environmental responsibility.",
    ],
    promiseTitle: "Wildo's promise",
    promise:
      "Every step in the magic forest is a chance to discover, dream, and protect. Wildo helps children return home with new knowledge and a heart full of love for the rainforest.",
    cta: "Join Wildo and become a rainforest guardian!",
  },
} as const;

export default function WildoPage() {
  const { lang } = useLanguage();
  const copy = content[lang];

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-lime-50 to-white px-4 py-10 dark:from-zinc-950 dark:via-emerald-950/30 dark:to-zinc-950">
      <DynamicHeroHeader showHeroSlider={false} />

      <div className="mx-auto mt-4 w-full max-w-5xl space-y-6">
        <section className="rounded-3xl border border-emerald-200/70 bg-white/90 p-8 shadow-xl backdrop-blur-sm dark:border-emerald-900/60 dark:bg-zinc-950/90 md:p-10">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-sm font-semibold text-emerald-700 dark:border-emerald-800/80 dark:bg-emerald-900/20 dark:text-emerald-300">
            <Sparkles size={16} />
            {copy.badge}
          </p>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white md:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-700 dark:text-zinc-300 md:text-lg">
            {copy.intro}
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-3 flex items-center gap-2 text-2xl font-semibold text-zinc-900 dark:text-white">
              <Leaf size={20} className="text-emerald-600" />
              {copy.missionTitle}
            </h2>
            <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">{copy.mission}</p>
          </article>

          <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-3 flex items-center gap-2 text-2xl font-semibold text-zinc-900 dark:text-white">
              <Stars size={20} className="text-emerald-600" />
              {copy.traitsTitle}
            </h2>
            <ul className="space-y-2 text-zinc-700 dark:text-zinc-300">
              {copy.traits.map((trait, index) => (
                <li key={index} className="flex gap-2">
                  <span className="mt-2 h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  <span>{trait}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-zinc-900 dark:text-white">
            <BookOpen size={20} className="text-emerald-600" />
            {copy.learningTitle}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {copy.learning.map((item, index) => (
              <p key={index} className="rounded-xl bg-zinc-50 p-4 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                {item}
              </p>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-sm dark:border-emerald-900/70 dark:bg-emerald-900/10">
          <h2 className="mb-3 flex items-center gap-2 text-2xl font-semibold text-zinc-900 dark:text-white">
            <ShieldCheck size={20} className="text-emerald-600" />
            {copy.promiseTitle}
          </h2>
          <p className="mb-5 leading-relaxed text-zinc-700 dark:text-zinc-300">{copy.promise}</p>
          <p className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-md shadow-emerald-900/30">
            <TreePine size={18} />
            <Heart size={18} />
            <Users size={18} />
            {copy.cta}
          </p>
        </section>

        {/* Galería de imágenes */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-6 flex items-center gap-2 text-2xl font-semibold text-zinc-900 dark:text-white">
            <Images size={20} className="text-emerald-600" />
            {lang === "es" ? "Galería de Wildo" : "Wildo Gallery"}
          </h2>
          <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
            {galleryImages.map((img, index) => (
              <div
                key={index}
                className="mb-3 overflow-hidden rounded-xl break-inside-avoid border border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={400}
                  height={400}
                  className="h-auto w-full object-cover transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                    (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
