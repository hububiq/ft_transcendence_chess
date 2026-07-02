import { useState, useEffect } from "react";
import { api } from "../../../api/axios";
import type { UserData } from "../interfaces";

export function useUser() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchMe = async () => {
      try {
        setError("");
        const response = await api.get("/api/me/");

        if (isMounted) setUser(response.data);
      } catch (err: any) {
        if (isMounted) {
          setError(
            err.response?.data?.detail || err.message || "Failed to load user",
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMe();

    return () => {
      isMounted = false;
    }; // cleanup function
  }, []);

  const updateUser = async (newUserData: UserData) => {
    try {
      if (!user) return false;

      const patchPayload: any = {};
      const profilePayload: any = {};

      if (newUserData.email !== user.email) {
        patchPayload.email = newUserData.email;
      }

      if (newUserData.username !== user.username) {
        patchPayload.username = newUserData.username;
      }

      if (newUserData.profile.bio !== user.profile.bio) {
        profilePayload.bio = newUserData.profile.bio;
      }

      if (newUserData.profile.location !== user.profile.location) {
        profilePayload.location = newUserData.profile.location;
      }

      if (Object.keys(profilePayload).length > 0) {
        patchPayload.profile = profilePayload;
      }
      await api.patch("/api/me/update/", patchPayload);
      setUser({
        ...user,
        username: newUserData.username,
        email: newUserData.email,
        profile: {
          ...user.profile,
          bio: newUserData.profile.bio,
          location: newUserData.profile.location,
        },
      });

      return true;

      // step 2: update the local react state
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update profile");
      return false;
    }
  };

  return { user, loading, error, updateUser };
}
