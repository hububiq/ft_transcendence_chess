import { useState } from "react";
import { api } from "../../../api/axios";
import { useNavigate } from "react-router";
import axios from "axios";

const REGISTER_URL = "/api/register/";

export function useRegister() {
  const navigate = useNavigate();

  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const executeRegister = async (payload: object) => {
    try {
      const response = await api.post(REGISTER_URL, payload);

      console.log(`Response data: ${response.data}`);
      console.log(`JSON: ${JSON.stringify(response)}`);
      setSuccess(true);

      navigate("/");
      //TODO: clear input fields
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrMsg(error.response?.data?.detail || "Registration failed");
      } else {
        setErrMsg("An unexpected error occurred.");
      }
    }

    setSuccess(true);
  };

  return {
    success,
    errMsg,
    executeRegister,
  };
}
