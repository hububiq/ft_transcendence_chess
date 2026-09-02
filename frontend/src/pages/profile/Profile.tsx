import { Crown, Calendar, Mail, MapPin } from "lucide-react";
import { useUser } from "../../hooks/useUser";
import { useState } from "react";
import { Modal } from "../../components/Modal";
import { EditProfileForm } from "./EditProfileFormModal";
import { StatsGrid } from "./ProfileStatsGrid";
import { useUpdateUser } from "../../hooks/useUpdateUser";
import type { UserData } from "../../utils/interfaces";
import playerAvatar from "../../assets/avatar_1.png";
import { resolveMediaUrl } from "../../utils/utils";

// Future Components ready to be uncommented
// import { Achievements } from "./ProfileAchievements";
// import { MatchHistory } from "./MatchHistory";
// import { RatingProgress } from "./RatingProgress";

export function Profile() {
  const { user, setUser, loading, error } = useUser();
  const { updateUser, isUpdating, updateError } = useUpdateUser();
  const [isEditing, setIsEditing] = useState(false);

  if (!user || loading) {
    return (
      <div className="text-white text-center mt-20">Loading profile...</div>
    );
  }

  const handleSave = async (formData: UserData, avatarFile?: File | null) => {
    if (!user) return;
    const updatedUser = await updateUser(user, formData, avatarFile);
    if (updatedUser) {
      setUser(updatedUser);
      setIsEditing(false);
    }
  };

  if (error) return <p>{error}</p>;

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8">
      {/* Profile Header */}
      {/* Profile Header */}
      <div className="bg-[#0a0a0a] border border-neutral-900 rounded-xl p-6 md:p-8">
        
        {/* Main Wrapper */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 md:gap-8">
          
          {/* Avatar & User Info Wrapper: Removed 'w-full' to stop it from pushing the button out */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 md:gap-8 flex-1">
            
            {/* Avatar Area */}
            <img
              src={resolveMediaUrl(user?.profile.avatar) || playerAvatar}
              alt="Profile Avatar"
              className="w-28 h-28 md:w-32 md:h-32 shrink-0 rounded-full border-4 border-blue-600/20 object-cover"
            />

            {/* User Info Area: Added min-w-0 to prevent long text from breaking the layout */}
            <div className="flex-1 flex flex-col items-center sm:items-start min-w-0 w-full">
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 mb-3 w-full">
                {!loading && (
                  <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight truncate">
                    {user?.username}
                  </h1>
                )}
                <div className="bg-blue-600/10 border border-blue-500/30 text-blue-400 px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-1.5 shrink-0">
                  <Crown className="w-4 h-4" />
                  ELO: {user?.profile?.elo_rating}
                </div>
              </div>

              {/* Metadata (Email, Location, Date) */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-sm text-neutral-400 mb-4">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="truncate max-w-[200px]">{user?.email || "No email provided"}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <MapPin className="w-4 h-4 shrink-0" />
                  {user?.profile?.location || "No location set"}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Calendar className="w-4 h-4 shrink-0" />
                   Joined {user?.date_joined ? new Date(user.date_joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Recently"}
                </div>
              </div>

              {/* Bio Area */}
              <div className="w-full max-w-2xl">
                <p className="text-neutral-300 text-sm leading-relaxed">
                  {user?.profile?.bio}
                </p>
              </div>
            </div>
          </div>

          {/* Actions Area (Edit Button) - shrink-0 guarantees it keeps its intended width */}
          <div className="shrink-0 w-full lg:w-auto flex justify-center sm:justify-start lg:justify-end mt-2 sm:mt-4 lg:mt-0">
            <button
              onClick={() => setIsEditing(true)}
              className="w-full sm:w-auto bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-2.5 px-6 rounded-lg border border-neutral-800 transition-colors"
            >
              Edit Profile
            </button>
          </div>
          
          <Modal isOpen={isEditing} onClose={() => setIsEditing(false)}>
            {isEditing && (
              <EditProfileForm
                initialData={user}
                onCancel={() => setIsEditing(false)}
                onSave={handleSave}
                errorMessage={updateError}
                isUpdating={isUpdating}
              />
            )}
          </Modal>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <StatsGrid user={user} />
      </div>

      {/* Two Column Layout (Ready for future use) */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <MatchHistory matchHistory={[]} />
         <RatingProgress />
      </div> */}

      {/* Achievements (Ready for future use) */}
      {/* <Achievements /> */}
    </div>
  );
}