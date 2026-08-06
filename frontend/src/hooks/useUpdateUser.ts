import { useState } from "react";
import type { UserData } from "../utils/interfaces";
import { api } from "../api/axios";
import axios from "axios";
import { fetchCurrentUser } from "../features/auth/api/authService";

export function useUpdateUser() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  const updateUser = async (
    currentUser: UserData,
    newUserData: UserData,
    avatarFile?: File | null,
  ) => {
    setIsUpdating(true);
    setUpdateError("");

    try {
      const patchPayload: {
        username?: string;
        bio?: string;
        location?: string;
      } = {};

      if (newUserData.username !== currentUser.username) {
        patchPayload.username = newUserData.username;
      }

      if (newUserData.profile.bio !== currentUser.profile.bio) {
        patchPayload.bio = newUserData.profile.bio;
      }

      if (newUserData.profile.location !== currentUser.profile.location) {
        patchPayload.location = newUserData.profile.location;
      }

      if (Object.keys(patchPayload).length > 0) {
        await api.patch("/api/me/update/", patchPayload);
      }

      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);

        await api.post("/api/me/avatar/", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      const refreshedUser = await fetchCurrentUser();
      return refreshedUser.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
    const errorData = err.response?.data;
    setUpdateError(
      errorData?.detail ||
      errorData?.error ||
      errorData?.message ||
      "Failed to update profile",
        );
      } else {
        setUpdateError("An unexpected error occurred while updating.");
      }
      return null;
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateUser, updateError, isUpdating };
}
