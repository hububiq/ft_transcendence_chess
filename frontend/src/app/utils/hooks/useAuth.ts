import type React from "react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router";

export function useAuth() {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLogin, setIsLogin] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const endpoint = isLogin ? "api/login/" : "api/register/";
  const payload = isLogin ? { email, password } : { username, email, password };
  async function handleAuthSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const response = await fetch(`http://localhost:8000/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        const backendReason =
          data.error || data.detail || data.message || "Invalid credentials.";
        console.log(`Backend reason: ${backendReason}`);
        setErrorMessage(backendReason);
        setPassword("");
        return;
      }
      const token = data.access || data.access_token;
      localStorage.setItem("access_token", token);
      setErrorMessage(null);
      navigate("/");
      console.log("Django's response:", data);
    } catch (error) {
      console.log(error);
      setErrorMessage(`Network problem: ${error}.`);
    }
  }

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

  return {
    username,
    setUsername,
    email,
    setEmail,
    password,
    setPassword,
    isLogin,
    setIsLogin,
    errorMessage,
    handleAuthSubmit,
    handleGitHubLogin,
    oauthLoading,
  };
}
