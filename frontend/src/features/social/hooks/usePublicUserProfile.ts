import { useEffect, useState } from "react";
import { api } from "../../../api/axios";
import type {
  PublicUserProfile,
  PublicUserProfileDetails,
} from "../types";


interface UsePublicUserProfileResult {
  profile: PublicUserProfile | null;
  isLoading: boolean;
  errorMessage: string | null;
}


interface ProfileRequestState {
  userId: number;
  profile: PublicUserProfile | null;
  errorMessage: string | null;
}


// Reuse validated profile data between repeated hover requests
const publicProfileCache =
  new Map<number, PublicUserProfile>();


// Reuse one active request when multiple components ask for the same user
const publicProfileRequests =
  new Map<number, Promise<PublicUserProfile>>();


function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}


function isNullableString(
  value: unknown,
): value is string | null {
  return (
    value === null ||
    typeof value === "string"
  );
}


function isProfileDetails(
  value: unknown,
): value is PublicUserProfileDetails {
  if (!isRecord(value)) {
    return false;
  }

  // Validate every public profile field before using API data in the UI
  return (
    isNullableString(value.avatar) &&
    isNullableString(value.oauth_avatar_url) &&
    typeof value.location === "string" &&
    typeof value.bio === "string" &&
    typeof value.elo_rating === "number" &&
    typeof value.peak_rating === "number" &&
    typeof value.total_games === "number" &&
    typeof value.wins === "number" &&
    typeof value.losses === "number" &&
    typeof value.draws === "number" &&
    typeof value.current_streak === "number"
  );
}


function isPublicUserProfile(
  value: unknown,
): value is PublicUserProfile {
  if (!isRecord(value)) {
    return false;
  }

  // Validate the public user identity before caching the response
  return (
    typeof value.id === "number" &&
    Number.isInteger(value.id) &&
    value.id > 0 &&
    typeof value.username === "string" &&
    isProfileDetails(value.profile)
  );
}


async function loadPublicUserProfile(
  userId: number,
): Promise<PublicUserProfile> {
  // Return cached data when this profile was already loaded
  const cachedProfile =
    publicProfileCache.get(userId);

  if (cachedProfile) {
    return cachedProfile;
  }

  // Avoid duplicate requests for the same user while one is still pending
  const pendingRequest =
    publicProfileRequests.get(userId);

  if (pendingRequest) {
    return pendingRequest;
  }

  const request = api
    .get<unknown>(
      `/api/users/${userId}/public-profile/`,
    )
    .then((response) => {
      if (!isPublicUserProfile(response.data)) {
        throw new Error(
          "Invalid public user profile response",
        );
      }

      // Cache only profile data that passed runtime validation
      publicProfileCache.set(
        userId,
        response.data,
      );

      return response.data;
    })
    .finally(() => {
      // Remove the finished request so future retries can start normally
      publicProfileRequests.delete(userId);
    });

  publicProfileRequests.set(
    userId,
    request,
  );

  return request;
}


export function usePublicUserProfile(
  userId: number,
): UsePublicUserProfileResult {
  // Start with cached data when this profile was loaded before
  const [requestState, setRequestState] =
    useState<ProfileRequestState>(() => ({
      userId,
      profile:
        publicProfileCache.get(userId) ?? null,
      errorMessage: null,
    }));


  const profile =
    requestState.userId === userId
      ? requestState.profile
      : publicProfileCache.get(userId) ?? null;


  const errorMessage =
    requestState.userId === userId
      ? requestState.errorMessage
      : null;


  useEffect(() => {
    // Skip the request when the profile is already available in cache
    if (publicProfileCache.has(userId)) {
      return;
    }

    let isDisposed = false;


    const loadProfile = async () => {
      try {
        const loadedProfile =
          await loadPublicUserProfile(userId);

        if (isDisposed) {
          return;
        }

        setRequestState({
          userId,
          profile: loadedProfile,
          errorMessage: null,
        });
      } catch {
        if (isDisposed) {
          return;
        }

        setRequestState({
          userId,
          profile: null,
          errorMessage:
            "User profile could not be loaded",
        });
      }
    };


    void loadProfile();


    return () => {
      // Ignore completed requests after the component using the hook unmounts
      isDisposed = true;
    };
  }, [userId]);


  return {
    profile,
    isLoading:
      profile === null &&
      errorMessage === null,
    errorMessage,
  };
}