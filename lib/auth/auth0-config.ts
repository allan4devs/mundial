const protocolPattern = /^https?:\/\//i;

function normalizeAuth0Domain(input?: string | null): string | undefined {
  const trimmed = input?.trim();
  if (!trimmed) {
    return undefined;
  }

  const withoutProtocol = trimmed.replace(protocolPattern, "");
  const domain = withoutProtocol.replace(/\/+$/, "");

  return domain || undefined;
}

export function getAuth0Issuer(): string | undefined {
  const domain = normalizeAuth0Domain(process.env.AUTH0_DOMAIN);
  return domain ? `https://${domain}` : undefined;
}

export function getAuth0PasswordResetUrl(): string | undefined {
  const domain = normalizeAuth0Domain(process.env.AUTH0_DOMAIN);
  return domain ? `https://${domain}/dbconnections/change_password` : undefined;
}

export function getAuthBaseUrl(): string | undefined {
  const input = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  const trimmed = input?.trim();

  if (!trimmed) {
    return undefined;
  }

  return trimmed.replace(/\/+$/, "");
}

type Auth0AuthorizationParams = {
  scope: string;
  redirect_uri?: string;
  audience?: string;
  connection?: string;
  organization?: string;
};

export function getAuth0AuthorizationParams(): Auth0AuthorizationParams {
  const baseUrl = getAuthBaseUrl();
  const audience = process.env.AUTH0_AUDIENCE?.trim();
  const connection = process.env.AUTH0_CONNECTION?.trim();
  const organization = process.env.AUTH0_ORGANIZATION?.trim();

  return {
    scope: "openid profile email",
    ...(baseUrl ? { redirect_uri: `${baseUrl}/api/auth/callback/auth0` } : {}),
    ...(audience ? { audience } : {}),
    ...(connection ? { connection } : {}),
    ...(organization ? { organization } : {}),
  };
}
