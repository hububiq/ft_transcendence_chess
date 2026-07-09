import { useState } from "react";
import type { UserData } from "../utils/interfaces";
import { api } from "../api/axios";
import axios from "axios";

export function useUpdateUser() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  const updateUser = async (currentUser: UserData, newUserData: UserData) => {
    setIsUpdating(true);
    setUpdateError("");

    try {
      const profilePayload: { bio?: string; location?: string } = {};
      const patchPayload: {
        username?: string;
        profile?: typeof profilePayload;
      } = {};

      if (newUserData.username !== currentUser.username) {
        patchPayload.username = newUserData.username;
      }

      if (newUserData.profile.bio !== currentUser.profile.bio) {
        profilePayload.bio = newUserData.profile.bio;
      }

      if (newUserData.profile.location !== currentUser.profile.location) {
        profilePayload.location = newUserData.profile.location;
      }

      if (Object.keys(profilePayload).length > 0) {
        patchPayload.profile = profilePayload;
      }
      // extract to authService.ts
      await api.patch("/api/me/update/", patchPayload);
      return {
        ...currentUser,
        ...patchPayload,
        profile: {
          ...currentUser.profile,
          ...profilePayload,
        },
      };
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setUpdateError(
          err.response?.data?.detail || "Failed to update profile",
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
