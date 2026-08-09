import Link from "next/link";
import { ArrowUpRight, Github } from "lucide-react";

import {
  CATEGORIES,
  PROJECTS,
  STATUS_LABEL,
  projectsByCategory,
  type Project,
} from "@/lib/projects";

const STATUS_STYLE: Record<Project["status"], string> = {
  live: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20",
  beta: "bg-amber-500/10 text-amber-300 ring-amber-500/20",
  wip: "bg-neutral-500/10 text-neutral-400 ring-neutral-500/20",
};

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const clickable = Boolean(project.href);

  const inner = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-neutral-100">
            {project.title}
          </h3>
          <p className="mt-0.5 text-sm text-neutral-500">{project.tagline}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${
            STATUS_STYLE[project.status]
          }`}
        >
          {STATUS_LABEL[project.status]}
        </span>
      </div>

      <p className="mt-4 flex-1 text-sm leading-relaxed text-neutral-400">
        {project.description}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        {project.stack.map((tech) => (
          <span
            key={tech}
            className="rounded-md bg-neutral-800/70 px-2 py-1 text-[11px] text-neutral-400"
          >
            {tech}
          </span>
        ))}
      </div>

      {clickable && (
        <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-neutral-300 transition-colors group-hover:text-white">
          Abrir
          <ArrowUpRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden
          />
        </span>
      )}
    </>
  );

  const className =
    "portfolio-rise group flex h-full flex-col rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-6 transition-colors";

  // Animate the grid in with a small stagger.
  const style = { animationDelay: `${Math.min(index, 8) * 45}ms` };

  if (!clickable) {
    return (
      <div className={`${className} opacity-70`} style={style}>
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={project.href!}
      className={`${className} hover:border-neutral-700 hover:bg-neutral-900/80`}
      style={style}
    >
      {inner}
    </Link>
  );
}

export default function HomePage() {
  const liveCount = PROJECTS.filter((p) => p.status === "live").length;

  return (
    <main className="min-h-screen bg-[#0a0a0b] text-neutral-200">
      <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
      <header className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">
          Portafolio
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-neutral-50 sm:text-5xl">
          Allan Rojas
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-neutral-400">
          Colección de proyectos que fui construyendo con Next.js: quinielas
          deportivas con datos en vivo, juegos 3D en el navegador, herramientas
          internas y sitios web para clientes. Todo corre en este mismo repo.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-500">
          <span>
            <strong className="font-semibold text-neutral-300">{PROJECTS.length}</strong>{" "}
            proyectos
          </span>
          <span>
            <strong className="font-semibold text-neutral-300">{liveCount}</strong> en
            línea
          </span>
          <a
            href="https://github.com/allan4devs/mundial"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-neutral-400 transition-colors hover:text-neutral-200"
          >
            <Github className="h-4 w-4" aria-hidden />
            Código
          </a>
        </div>
      </header>

      <div className="mt-16 space-y-16">
        {CATEGORIES.map((category) => {
          const items = projectsByCategory(category.id);
          if (items.length === 0) return null;

          return (
            <section key={category.id} aria-labelledby={`cat-${category.id}`}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-neutral-800/80 pb-4">
                <h2
                  id={`cat-${category.id}`}
                  className="text-xl font-semibold tracking-tight text-neutral-100"
                >
                  {category.label}
                </h2>
                <p className="text-sm text-neutral-500">{category.blurb}</p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((project, i) => (
                  <ProjectCard key={project.id} project={project} index={i} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

        <footer className="mt-24 border-t border-neutral-800/80 pt-8 text-sm text-neutral-600">
          Hecho con Next.js y Tailwind CSS.
        </footer>
      </div>
    </main>
  );
}
