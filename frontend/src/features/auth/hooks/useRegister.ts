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

function getErrorText(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const message = value.find((item) => typeof item === "string");

    return typeof message === "string" ? message : null;
  }

  return null;
}

function capitalizeErrorMessage(message: string): string {
  if (!message) {
    return message;
  }

  return message.charAt(0).toUpperCase() + message.slice(1);
}

function getRegistrationErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  const errors = data as Record<string, unknown>;

  // Prefer registration fields so duplicate account errors stay clear
  const fieldMessage =
    getErrorText(errors.username) ??
    getErrorText(errors.email) ??
    getErrorText(errors.password) ??
    getErrorText(errors.detail);

  if (fieldMessage) {
    return capitalizeErrorMessage(fieldMessage);
  }

  for (const value of Object.values(errors)) {
    const message = getErrorText(value);

    if (message) {
      return message;
    }
  }

  return null;
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

        if (refreshToken) {
          localStorage.setItem("refersh_token", refreshToken);
        }

        const userResponse = await fetchCurrentUser();
        setUser(userResponse.data);
        setSuccess(true);
        navigate("/");
      } else {
        navigate("/login");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = getRegistrationErrorMessage(error.response?.data);

        setErrMsg(errorMessage ?? "Registration failed");
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
