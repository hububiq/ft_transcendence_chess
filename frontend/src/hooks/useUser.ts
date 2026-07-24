import { useState, useEffect } from "react";
import type { UserData } from "../utils/interfaces";
import { fetchCurrentUser } from "../features/auth/api/authService";
import axios from "axios";

export function useUser() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchMe = async () => {
      try {
        setError("");
        const response = await fetchCurrentUser();
        console.log(response.data);
        if (isMounted) setUser(response.data);
      } catch (error) {
        if (isMounted && axios.isAxiosError(error)) {
          setError(
            error?.response?.data?.detail ||
              error.message ||
              "Failed to load user",
          );
        } else {
          setError("An unexpected error occurred.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMe();

    return () => {
      isMounted = false;
    };
  }, []);

  // const updateUser = async (newUserData: UserData) => {
  //   try {
  //     if (!user) return false;

  //     const patchPayload = {};
  //     const profilePayload = {};

  //     if (newUserData.email !== user.email) {
  //       patchPayload.email = newUserData.email;
  //     }

  //     if (newUserData.username !== user.username) {
  //       patchPayload.username = newUserData.username;
  //     }

  //     if (newUserData.profile.bio !== user.profile.bio) {
  //       profilePayload.bio = newUserData.profile.bio;
  //     }

  //     if (newUserData.profile.location !== user.profile.location) {
  //       profilePayload.location = newUserData.profile.location;
  //     }

  //     if (Object.keys(profilePayload).length > 0) {
  //       patchPayload.profile = profilePayload;
  //     }
  //     // extract to authService.ts
  //     await api.patch("/api/me/update/", patchPayload);
  //     setUser({
  //       ...user,
  //       username: newUserData.username,
  //       email: newUserData.email,
  //       profile: {
  //         ...user.profile,
  //         bio: newUserData.profile.bio,
  //         location: newUserData.profile.location,
  //       },
  //     });
  //     return true;
  //   } catch (err: any) {
  //     setError(err.response?.data?.detail || "Failed to update profile");
  //     return false;
  //   }
  // };

  return { user, loading, error, setUser };
}
