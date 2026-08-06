import React, { useEffect, useState } from "react";
import { X, AlertCircle } from "lucide-react";
import clsx from "clsx";
import type { UserData } from "../../utils/interfaces";
import { resolveMediaUrl } from "../../utils/utils";

interface EditProfileFormProps {
  initialData: UserData;
  onSave: (newName: UserData, avatarFile?: File | null) => void;
  onCancel: () => void;
  errorMessage?: string;
  isUpdating?: boolean;
}

export function EditProfileForm({
  initialData,
  onSave,
  onCancel,
  errorMessage,
  isUpdating,
}: EditProfileFormProps) {
  const [draftData, setDraftData] = useState<UserData>(initialData);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(
    resolveMediaUrl(initialData.profile.avatar) ||
      initialData.profile.oauth_avatar_url ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200&h=200",
  );
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    setDraftData(initialData);
    setAvatarFile(null);
    setAvatarPreview(
      resolveMediaUrl(initialData.profile.avatar) ||
        initialData.profile.oauth_avatar_url ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200&h=200",
    );
  }, [initialData]);

  // Form Submission Handler
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (draftData.username.length < 3) {
      setLocalError("Cannot submit the form.");
    } else {
      onSave(draftData, avatarFile);
    }
  };
  const isAvatarError = errorMessage?.toLowerCase().includes("avatar");

  return (
    <div className="bg-[#080808] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-900">
        <div>
          <div className="text-base font-semibold text-white">Edit Profile</div>
          <div className="text-xs text-neutral-500 mt-0.5">
            Update your public profile information.
          </div>
        </div>
        <button
          onClick={onCancel}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-900 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* The Form Wrapper */}
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-6 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <img
              src={avatarPreview}
              alt="Current avatar preview"
              className="w-16 h-16 rounded-full border-2 border-neutral-800 object-cover"
            />
            <div className="flex-1">
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Avatar
              </label>
              <input
                type="file"
                accept="image/jpeg, image/png"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setAvatarFile(file);

                  if (file) {
                    setAvatarPreview(URL.createObjectURL(file));
                  }
                }}
                className="block w-full text-sm text-neutral-400 file:mr-4 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-800"
              />
              {errorMessage && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400">
                  <AlertCircle className="w-3 h-3" /> {errorMessage}
                </p>
            )}
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Username
            </label>
            <input
              value={draftData.username}
              onChange={(e) => {
                const val = e.target.value.slice(0, 24);
                setDraftData({
                  ...draftData,
                  username: e.target.value,
                });
                if (e.target.value.length < 3) {
                  setLocalError(
                    "Username must be at least 3 characters long.",
                  );
                } else if (val.length > 24) {
                  setLocalError("Username cannot exceed 24 characters.");
                } else {
                  setLocalError("");
              }
            }}
            maxLength={24}
              className={clsx(
                "w-full bg-black border rounded-lg py-2.5 px-3.5 text-sm text-neutral-200 placeholder:text-neutral-700 focus:outline-none transition-all",
                errorMessage && !isAvatarError
                  ? "border-red-500/50 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/30"
                  : "border-neutral-800 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30",
              )}
              placeholder="Your username"
            />
            {/* 
            {errorMessage && (
              <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1.5">
                <AlertCircle className="w-3 h-3" /> {errorMessage}
              </p>
            )}
            */}
            {localError && (
              <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1.5">
                <AlertCircle className="w-3 h-3" /> {localError}
              </p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Bio
            </label>
            <textarea
              maxLength={250}
              rows={3}
              value={draftData.profile.bio || ""}
              onChange={(e) =>
                setDraftData({
                  ...draftData,
                  profile: {
                    ...draftData.profile,
                    bio: e.target.value,
                  },
                })
              }
              className="w-full bg-black border border-neutral-800 rounded-lg py-2.5 px-3.5 text-sm text-neutral-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all resize-none"
              placeholder="Tell the community a bit about yourself…"
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-xs text-neutral-500">
                Bio can be up to 250 characters.
              </p>
              <p className="text-xs text-neutral-500">
                {draftData.profile.bio?.length ?? 0}/250
              </p>
</div>
          </div>
        </div>
        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-900 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel} // the form blindly pushed the button!
            disabled={isUpdating}
            className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white bg-transparent hover:bg-neutral-900 rounded-lg border border-neutral-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isUpdating}
            className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
