import { useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { loginRequest, fetchCurrentUser } from "../api/authService";
import { useAuth } from "../context/AuthProvider";

interface LoginCredentials {
  username: string;
  password: string;
}

export function useLogin() {
  const navigate = useNavigate();
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const { setUser } = useAuth();

  const executeLogin = async (payload: LoginCredentials) => {
    setErrMsg(null);
    try {
      const response = await loginRequest(payload);
      const token = response.data.access;

      if (token) {
        localStorage.setItem("access_token", token);
        const userResponse = await fetchCurrentUser();
        setUser(userResponse.data);
      } else {
        console.log(
          "Login successful, but no token was found in the response.",
        );
      }
      navigate("/");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrMsg(error.response?.data?.detail || "Login failed");
      } else {
        setErrMsg("An unexpected error occurred.");
      }
    }
  };

  return { executeLogin, errMsg };
}
