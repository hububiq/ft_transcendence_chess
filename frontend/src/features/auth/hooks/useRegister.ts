import { useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { registerRequest } from "../api/authService";

interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export function useRegister() {
  const navigate = useNavigate();
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const executeRegister = async (payload: RegisterPayload) => {
    setErrMsg(null);
    setSuccess(false);
    try {
      const response = await registerRequest(payload);

      const token = response.data.access;
      if (token) {
        localStorage.setItem("access_token", token);
      } else {
        console.log(
          "Register successful, but no token was found in the response.",
        );
      }

      setSuccess(true);
      navigate("/");
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
