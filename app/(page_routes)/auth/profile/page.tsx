"use client";

import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import { User, Mail, LogOut, ArrowLeft, Phone, KeyRound, Save } from "lucide-react";
import Link from "next/link";

type UserProfileResponse = {
  profile?: {
    name?: string;
    email?: string;
    phone?: string;
  };
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (!session?.user) return;

    const sessionName = session.user.name ?? "";
    const sessionEmail = session.user.email ?? "";

    setName(sessionName);
    setEmail(sessionEmail);

    fetch("/api/user/profile")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: UserProfileResponse | null) => {
        const profile = data?.profile;
        if (!profile) return;

        setName(profile.name ?? sessionName);
        setEmail(profile.email ?? sessionEmail);
        setPhone(profile.phone ?? "");
      })
      .catch(() => {
        // keep fallback values from session
      });
  }, [session?.user]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 text-center gap-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Inicia sesión para ver tu perfil</h1>
        <button
          onClick={() => signIn(undefined, { callbackUrl: "/auth/profile" })}
          className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-900/20 active:translate-y-0 active:scale-[0.99] cursor-pointer"
        >
          Iniciar sesión
        </button>
        <Link href="/" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          <ArrowLeft size={14} /> Volver al inicio
        </Link>
      </div>
    );
  }

  const { image } = session.user;

  const saveProfile = async () => {
    setProfileMessage(null);

    if (!name.trim()) {
      setProfileMessage("El nombre es obligatorio.");
      return;
    }

    setIsSavingProfile(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });

      const data = await response.json();
      if (!response.ok) {
        setProfileMessage(data?.error ?? "No se pudo guardar el perfil.");
        return;
      }

      setProfileMessage("Perfil actualizado correctamente.");
    } catch {
      setProfileMessage("No se pudo guardar el perfil.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const changePassword = async () => {
    setPasswordMessage(null);

    if (!currentPassword || !newPassword) {
      setPasswordMessage("Debes completar ambas contraseñas.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        setPasswordMessage(data?.error ?? "No se pudo actualizar la contraseña.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setPasswordMessage("Contraseña actualizada correctamente.");
    } catch {
      setPasswordMessage("No se pudo actualizar la contraseña.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 p-8 space-y-8">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0 w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-200 dark:border-emerald-800">
            {image ? (
              <Image src={image} alt={name || "User"} fill className="object-cover" sizes="64px" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                <User size={28} className="text-emerald-600 dark:text-emerald-400" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Mi Perfil</h1>
            <p className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              <Mail size={13} /> {email}
            </p>
          </div>
        </div>

        <section className="space-y-4 border-t border-zinc-200 dark:border-zinc-800 pt-6">
          <h2 className="font-semibold text-zinc-900 dark:text-white">Datos del perfil</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-300">Nombre</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-300">Correo</span>
              <input value={email} disabled className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-zinc-600 dark:text-zinc-300 flex items-center gap-1"><Phone size={14} /> Teléfono</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+506 8888 9999" className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2" />
            </label>
          </div>
          <button
            onClick={saveProfile}
            disabled={isSavingProfile}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save size={14} /> {isSavingProfile ? "Guardando..." : "Guardar perfil"}
          </button>
          {profileMessage && <p className="text-sm text-zinc-600 dark:text-zinc-300">{profileMessage}</p>}
        </section>

        <section className="space-y-4 border-t border-zinc-200 dark:border-zinc-800 pt-6">
          <h2 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2"><KeyRound size={16} /> Cambiar contraseña</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-300">Contraseña actual</span>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-300">Nueva contraseña</span>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2" />
            </label>
          </div>
          <button
            onClick={changePassword}
            disabled={isUpdatingPassword}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isUpdatingPassword ? "Actualizando..." : "Actualizar contraseña"}
          </button>
          {passwordMessage && <p className="text-sm text-zinc-600 dark:text-zinc-300">{passwordMessage}</p>}
        </section>

        <div className="flex flex-col gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <Link href="/dashboard" className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
            Ir al Dashboard
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      </div>
    </main>
  );
}
