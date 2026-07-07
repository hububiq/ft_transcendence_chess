import { useEffect } from "react";
import { useNavigate } from "react-router";

export function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      // Exchange code for tokens
      fetch("http://localhost:8000/api/github/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Django OAuth Response:", data);
          const realToken = data.access || data.access_token || data.token;

          if (realToken) {
            localStorage.setItem("access_token", realToken);
            navigate("/");
          } else {
            console.error(
              "Critical: No token found in backend response!",
              data,
            );
            navigate("/auth");
          }
        })
        .catch((error) => console.error("OAuth error:", error));
    }
  }, [navigate]);

  return <div>Processing login...</div>;
}
