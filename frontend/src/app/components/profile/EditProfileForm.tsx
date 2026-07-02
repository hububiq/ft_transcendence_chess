import React, { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import clsx from "clsx";
import type { UserData } from "../../utils/interfaces";

interface EditProfileFormProps {
  initialData: UserData;
  onSave: (newName: UserData) => void;
  onCancel: () => void;
  errorMessage?: string;
}

export function EditProfileForm({
  initialData,
  onSave,
  onCancel,
  errorMessage,
}: EditProfileFormProps) {
  const [draftData, setDraftData] = useState<UserData>(initialData);

  // Form Submission Handler
  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(draftData);
  };

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
          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Username
            </label>
            <input
              value={draftData.username}
              onChange={(e) => {
                setDraftData({
                  ...draftData,
                  username: e.target.value,
                });
              }}
              className={clsx(
                "w-full bg-black border rounded-lg py-2.5 px-3.5 text-sm text-neutral-200 placeholder:text-neutral-700 focus:outline-none transition-all",
                errorMessage
                  ? "border-red-500/50 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/30"
                  : "border-neutral-800 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30",
              )}
              placeholder="Your username"
            />
            {errorMessage && (
              <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1.5">
                <AlertCircle className="w-3 h-3" /> {errorMessage}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Email address
            </label>
            <input
              type="email"
              value={draftData.email}
              onChange={(e) =>
                setDraftData({ ...draftData, email: e.target.value })
              }
              className="w-full bg-black border border-neutral-800 rounded-lg py-2.5 px-3.5 text-sm text-neutral-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
              placeholder="you@example.com"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Bio
            </label>
            <textarea
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
          </div>
        </div>
        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-900 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel} // the form blindly pushed the button!
            className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white bg-transparent hover:bg-neutral-900 rounded-lg border border-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 transition-all"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
