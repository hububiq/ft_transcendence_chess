import { useState } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

interface EditProfileFormProps {
  initialName: string;
  onSave: (newName: string) => void;
}

export function EditProfileForm({ initialName, onSave }: EditProfileFormProps) {
  const [draftName, setDraftName] = useState(initialName);

  return (
    <div className="bg-[#080808] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-900">
        <div>
          <div className="text-base font-semibold text-white">Edit Profile</div>
          <div className="text-xs text-neutral-500 mt-0.5">
            Update your public profile information.
          </div>
          <div className="flex">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-900 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Username */}
      <div>
        <label className="block text-xs font-medium text-neutral-400 mb-1.5">
          Username
        </label>
        <h2 className="w-full bg-black border rounded-lg py-2.5 px-3.5 text-sm text-neutral-200 placeholder:text-neutral-700 focus:outline-none transition-all">
          Edit Profile
        </h2>

        <input
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          className="border p-2 rounded"
          placeholder="Your username"
        />
      </div>

      <button onClick={() => onSave(draftName)}>Save Changes</button>
    </div>
  );
}
