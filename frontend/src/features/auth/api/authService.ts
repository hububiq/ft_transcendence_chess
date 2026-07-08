// This file is responsible for talking to your Django/FastAPI backend.
// and returns Promise (via Axios)
import { api } from "../../../api/axios";

export const loginRequest = async (credentials: object) => {
  return api.post("/api/login/", credentials);
};

export const registerRequest = async (newUserData: object) => {
  return api.post("/api/register/", newUserData);
};

export const fetchCurrentUser = async () => {
  return api.get("/api/me/");
};
