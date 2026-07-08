import { useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { loginRequest } from "../api/authService";

export function useLogin() {
  const navigate = useNavigate();

  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const executeLogin = async (payload: object) => {
    setErrMsg(null);
    try {
      const response = await loginRequest(payload);

      const token = response.data.access;
      if (token) {
        localStorage.setItem("access_token", token);
      } else {
        console.log(
          "Login successful, but no token was found in the response.",
        );
      }
      setSuccess(true);
      navigate("/");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrMsg(error.response?.data?.detail || "Login failed");
      } else {
        setErrMsg("An unexpected error occurred.");
      }
    }
  };

  return { executeLogin, success, errMsg };
}
