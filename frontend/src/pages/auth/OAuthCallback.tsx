import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../../features/auth/context/AuthProvider";
import {
  exchangeGithubCode,
  fetchCurrentUser,
} from "../../features/auth/api/authService";

export function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Cleaner than window.location.search
  const { setUser } = useAuth();

  // guard
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;

    const code = searchParams.get("code");
    if (!code) {
      navigate("/auth");
    }

    hasFetched.current = true;

    const processOAuth = async () => {
      try {
        // exchange code for token
        const response = await exchangeGithubCode(code);
        const data = response.data;

        console.log("DJANGO RESPONSE:", data);

        const realToken = data.access || data.access_token || data.token;
        const refreshToken = data.refresh || data.refresh_token;

        if (realToken) {
          localStorage.setItem("access_token", realToken);
          if (refreshToken) localStorage.setItem("refresh_token", refreshToken);

          const userResponse = await fetchCurrentUser();
          setUser(userResponse.data);
          navigate("/");
        } else {
          console.error("Critical: No token found in backend response!", data);
          // navigate("/login");
        }
      } catch (error) {
        console.error("OAuth error:", error);
        // If the code is invalid or expired, kick them back to login
        // navigate("/login");
      }
    };
    processOAuth();
  }, [navigate, searchParams, setUser]);

  return (
    <div className="flex justify-center items-center h-screen">
      <p>Authenticating securely with GitHub...</p>
    </div>
  );
}
