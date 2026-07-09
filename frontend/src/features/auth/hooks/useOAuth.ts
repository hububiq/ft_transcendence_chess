import { useState } from "react";

export function useOAuth() {
  const [oauthLoading, setOauthLoading] = useState<"github" | null>(null);

  const handleGitHubLogin = (provider: "github") => {
    setOauthLoading(provider);

    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = encodeURIComponent(
      "http://localhost:3000/auth/github/callback",
    );
    const scope = encodeURIComponent("openid email profile");

    const authUrl =
      `https://github.com/login/oauth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `scope=${scope}&` +
      `response_type=code`;
    window.location.href = authUrl;
    console.log(authUrl);
  };

  return { oauthLoading, handleGitHubLogin };
}
