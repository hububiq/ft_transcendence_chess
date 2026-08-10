import { Crown, Calendar, Mail, MapPin } from "lucide-react";
import { useUser } from "../../hooks/useUser";
import { useState } from "react";
import { Modal } from "../../components/Modal";
import { EditProfileForm } from "./EditProfileFormModal";
import { StatsGrid } from "./ProfileStatsGrid";
import { useUpdateUser } from "../../hooks/useUpdateUser";
import type { UserData } from "../../utils/interfaces";
import { Achievements } from "./ProfileAchievements";
import playerAvatar from "../../assets/avatar_1.png";

export function Profile() {
  const { user, setUser, loading, error } = useUser();
  const { updateUser, isUpdating, updateError } = useUpdateUser();
  const [isEditing, setIsEditing] = useState(false);

  if (!user || loading) {
    return (
      <div className="text-white text-center mt-20">Loading profile...</div>
    );
  }

  const handleSave = async (formData: UserData) => {
    if (!user) return;
    const updatedUser = await updateUser(user, formData);
    if (updatedUser) {
      setUser(updatedUser);
      setIsEditing(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-[#0a0a0a] border border-neutral-900 rounded-xl p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <img
            src={user?.profile.avatar || playerAvatar}
            alt="Profile Avatar"
            className="w-24 h-24 rounded-full border-4 border-blue-600/20 object-cover"
          />

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
              {!loading && (
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  {user?.username}
                </h1>
              )}
              <div className="flex items-center gap-2">
                <div className="bg-blue-600/10 border border-blue-500/30 text-blue-400 px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-1.5">
                  <Crown className="w-4 h-4" />
                  ELO: {user?.profile?.elo_rating}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400 mb-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user?.email}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                *Warsaw, Poland
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                *Joined January 2024
              </div>
            </div>

            <p className="text-neutral-300 text-sm max-w-2xl">
              {user?.profile?.bio}
            </p>
          </div>

          {/* Edit Profile Button & Modal */}
          <button
            onClick={() => setIsEditing(true)}
            className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-2.5 px-6 rounded-lg border border-neutral-800 transition-colors"
          >
            Edit Profile
          </button>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsGrid user={user} />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Match History - Takes 2 columns */}
        {/* <div className="lg:col-span-2">
          <Card className="bg-[#0a0a0a] border-neutral-900">
            <CardHeader>
              <CardTitle className="text-white">Match History</CardTitle>
              <CardDescription className="text-neutral-500">
                Your recent game results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {matchHistory.map((match) => (
                  <div
                    key={match.id}
                    className="bg-black border border-neutral-900 rounded-lg p-4 hover:border-neutral-700 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div
                          className={clsx(
                            "w-1.5 h-12 rounded-full",
                            match.result === "Win"
                              ? "bg-green-500"
                              : match.result === "Loss"
                                ? "bg-red-500"
                                : "bg-neutral-600",
                          )}
                        />
                        <div>
                          <p className="text-sm font-semibold text-neutral-200">
                            {match.opponent}
                          </p>
                          <p className="text-xs text-neutral-600 mt-1">
                            {match.type} • {match.date}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={clsx(
                            "text-sm font-bold mb-1",
                            match.result === "Win"
                              ? "text-green-500"
                              : match.result === "Loss"
                                ? "text-red-500"
                                : "text-neutral-400",
                          )}
                        >
                          {match.result}
                        </p>
                        <p
                          className={clsx(
                            "text-xs font-medium",
                            match.eloChange.startsWith("+")
                              ? "text-green-500"
                              : match.eloChange === "0"
                                ? "text-neutral-500"
                                : "text-red-500",
                          )}
                        >
                          {match.eloChange}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-6">
                      <div className="text-[10px] text-neutral-600 uppercase tracking-wider">
                        Opening:
                      </div>
                      <div className="text-xs text-neutral-400">
                        {match.opening}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 bg-transparent hover:bg-neutral-900 text-neutral-400 hover:text-white font-medium py-2.5 px-6 rounded-lg border border-neutral-800 transition-colors text-sm">
                View All Matches
              </button>
            </CardContent>
          </Card>
        </div> */}

        {/* Rating Progress - Takes 1 column */}
        {/* <div className="space-y-6">
          <Card className="bg-[#0a0a0a] border-neutral-900">
            <CardHeader>
              <CardTitle className="text-white">Rating Progress</CardTitle>
              <CardDescription className="text-neutral-500">
                Last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs text-neutral-500 uppercase tracking-wide">
                      Bullet
                    </span>
                    <span className="text-lg font-bold text-white">1,987</span>
                  </div>
                  <div className="w-full bg-black rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-blue-500 h-full"
                      style={{ width: "78%" }}
                    />
                  </div>
                  <div className="text-xs text-green-500 mt-1 font-medium">
                    +45 this month
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs text-neutral-500 uppercase tracking-wide">
                      Blitz
                    </span>
                    <span className="text-lg font-bold text-white">2,145</span>
                  </div>
                  <div className="w-full bg-black rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-purple-500 h-full"
                      style={{ width: "85%" }}
                    />
                  </div>
                  <div className="text-xs text-green-500 mt-1 font-medium">
                    +28 this month
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs text-neutral-500 uppercase tracking-wide">
                      Rapid
                    </span>
                    <span className="text-lg font-bold text-white">2,001</span>
                  </div>
                  <div className="w-full bg-black rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-600 to-green-500 h-full"
                      style={{ width: "82%" }}
                    />
                  </div>
                  <div className="text-xs text-red-500 mt-1 font-medium">
                    -12 this month
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div> */}
      </div>

      {/* Achievements */}
      <Achievements />
    </div>
  );
}
