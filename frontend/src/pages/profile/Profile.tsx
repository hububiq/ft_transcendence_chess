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
import { Link } from "react-router";

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
    <div className="min-h-screen p-4 sm:p-8 max-w-6xl mx-auto flex flex-col gap-8">
      {/* Profile Header */}
      <div className="bg-[#0a0a0a] border border-neutral-900 rounded-xl p-6 md:p-8">
        
        {/* Main Wrapper: Shifted breakpoints to 'xl' so it stacks vertically in squeezed middle columns */}
        <div className="flex flex-col xl:flex-row items-center xl:items-start justify-between gap-6 md:gap-8 w-full">
          
          {/* Avatar & User Info Wrapper */}
          <div className="flex flex-col xl:flex-row items-center xl:items-start text-center xl:text-left gap-6 md:gap-8 flex-1 min-w-0 w-full">
            
            {/* Avatar Area */}
            <img
              src={
                resolveMediaUrl(user?.profile.avatar) ||
                user?.profile.oauth_avatar_url ||
                playerAvatar
              }
              alt="Profile Avatar"
              className="w-28 h-28 md:w-32 md:h-32 shrink-0 rounded-full border-4 border-blue-600/20 object-cover"
            />

            {/* User Info Area */}
            <div className="flex-1 flex flex-col items-center xl:items-start min-w-0 w-full">
              
              {/* Header Row (Username & ELO) */}
              <div className="flex flex-col md:flex-row items-center justify-center xl:justify-start gap-3 mb-3 w-full">
                {!loading && (
                  <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight truncate max-w-full">
                    {user?.username}
                  </h1>
                )}
                <div className="bg-blue-600/10 border border-blue-500/30 text-blue-400 px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-1.5 shrink-0">
                  <Crown className="w-4 h-4" />
                  ELO: {user?.profile?.elo_rating}
                </div>
              </div>

              {/* Metadata (Email, Location, Date) */}
              <div className="flex flex-col md:flex-row flex-wrap items-center justify-center xl:justify-start gap-3 md:gap-4 text-sm text-neutral-400 mb-4">
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
              <div className="w-full max-w-2xl flex flex-col items-center xl:items-start">
                <p className="text-neutral-300 text-sm leading-relaxed text-center xl:text-left">
                  {user?.profile?.bio}
                </p>
              </div>
            </div>
          </div>

          {/* Actions Area (Edit Button) - Centered at the absolute bottom of the stack until xl screens */}
          <div className="shrink-0 w-full sm:w-auto flex justify-center xl:justify-end mt-2 md:mt-4 xl:mt-0">
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

       {/* Achievements */}
      {/* <Achievements /> */}

      {/* Footer Links */}
      <div className="mt-auto flex justify-center items-center gap-4 pt-8 pb-2 text-sm text-neutral-700">
        <Link
          to="/terms"
          className="hover:text-white transition-colors"
        >
          Terms of Service
        </Link>

        <span className="text-neutral-700">•</span>

        <Link
          to="/privacy"
          className="hover:text-white transition-colors"
        >
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}