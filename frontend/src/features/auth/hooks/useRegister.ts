import { useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import {
  registerRequest,
  fetchCurrentUser,
  loginRequest,
} from "../api/authService";
import { useAuth } from "../context/AuthProvider";

interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export function useRegister() {
  const navigate = useNavigate();
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { setUser } = useAuth();

  const executeRegister = async (payload: RegisterPayload) => {
    setErrMsg(null);
    setSuccess(false);

    try {
      const response = await registerRequest(payload);
      let token = response.data?.access;
      let refreshToken = response.data?.refresh;

      if (!token) {
        const loginResponse = await loginRequest({
          email: payload.email,
          password: payload.password,
        });
        token = loginResponse.data.access;
        refreshToken = loginResponse.data.refresh;
      }

      if (token) {
        localStorage.setItem("access_token", token);
        const userResponse = await fetchCurrentUser();
        setUser(userResponse.data);
        setSuccess(true);
        navigate("/");
      } else {
        navigate("/login");
        console.log(
          "Register successful, but no token was found in the response.",
        );
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrMsg(error.response?.data?.detail || "Registration failed");
      } else {
        setErrMsg("An unexpected error occurred.");
      }
      setSuccess(false);
    }
  };

  return {
    success,
    errMsg,
    executeRegister,
  };
}
