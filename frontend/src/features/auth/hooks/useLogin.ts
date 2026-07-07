import { useState } from "react";
import { api } from "../../../api/axios";
import { useNavigate } from "react-router";
import axios from "axios";

const LOGIN_URL = "/api/login/";

export function useLogin() {
  const navigate = useNavigate();

  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const executeLogin = async (payload: object) => {
    try {
      const response = await api.post(LOGIN_URL, payload);

      console.log(`Response data: ${response.data}`);
      setSuccess(true);

      navigate("/");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrMsg(error.response?.data?.detail || "Registration failed");
      } else {
        setErrMsg("An unexpected error occurred.");
      }
    }
  };

  return { executeLogin, success, errMsg };
}
