// lib/constants/auth.ts
// Centraliza todas las constantes de autenticación, JWT y cookies.

/** Duración del JWT para operadores B2B y admins */
export const TOKEN_EXPIRY = "7d";

/** Rounds de bcrypt para hashear contraseñas */
export const BCRYPT_SALT_ROUNDS = 12;

/** Longitud mínima requerida para contraseñas */
export const MIN_PASSWORD_LENGTH = 8;

/** Tiempo de vida del token de verificación de email (24 horas en ms) */
export const VERIFICATION_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

/** Tiempo de vida del token de reset de contraseña (1 hora en ms) */
export const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

/** maxAge de la cookie de sesión (7 días en segundos) */
export const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/** Nombre de la cookie de sesión B2B para operadores */
export const B2B_COOKIE_NAME = "b2b_token";

/** Nombre de la cookie de sesión para admins */
export const ADMIN_COOKIE_NAME = "b2b_admin_token";
