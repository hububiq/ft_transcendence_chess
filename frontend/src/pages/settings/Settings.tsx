import {
  Bell,
  Shield,
  Globe,
  Palette,
  Volume2,
  User,
  Moon,
  Monitor,
  Smartphone,
  Check,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/card";
import { useState } from "react";
import clsx from "clsx";

export function Settings() {
  const [notifications, setNotifications] = useState({
    gameInvites: true,
    tournamentReminders: true,
    friendRequests: true,
    gameResults: false,
  });

  const [boardTheme, setBoardTheme] = useState("classic");
  const [pieceSet, setPieceSet] = useState("modern");
  const [soundEnabled, setSoundEnabled] = useState(true);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header className="border-b border-neutral-900 pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Settings
        </h1>
        <p className="text-neutral-500 mt-2">
          Manage your account preferences and application settings.
        </p>
      </header>

      {/* Account Settings */}
      <Card className="bg-[#0a0a0a] border-neutral-900">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-white">Account Settings</CardTitle>
              <CardDescription className="text-neutral-500">
                Manage your profile and account details
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-black border border-neutral-900 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-white mb-1">Username</h3>
              <p className="text-xs text-neutral-500">GrandMaster42</p>
            </div>
            <button className="bg-transparent hover:bg-neutral-900 text-neutral-400 hover:text-white font-medium py-2 px-4 rounded-lg border border-neutral-800 transition-colors text-xs">
              Change
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-black border border-neutral-900 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-white mb-1">Password</h3>
              <p className="text-xs text-neutral-500">••••••••••••</p>
            </div>
            <button className="bg-transparent hover:bg-neutral-900 text-neutral-400 hover:text-white font-medium py-2 px-4 rounded-lg border border-neutral-800 transition-colors text-xs">
              Change
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-[#0a0a0a] border-neutral-900">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-white">Notifications</CardTitle>
              <CardDescription className="text-neutral-500">
                Choose what notifications you want to receive
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-black border border-neutral-900 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-white mb-1">
                Game Invites
              </h3>
              <p className="text-xs text-neutral-500">
                Receive notifications when someone challenges you
              </p>
            </div>
            <button
              onClick={() =>
                setNotifications({
                  ...notifications,
                  gameInvites: !notifications.gameInvites,
                })
              }
              className={clsx(
                "w-12 h-6 rounded-full transition-colors relative",
                notifications.gameInvites ? "bg-blue-600" : "bg-neutral-800",
              )}
            >
              <div
                className={clsx(
                  "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform",
                  notifications.gameInvites
                    ? "translate-x-6"
                    : "translate-x-0.5",
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-black border border-neutral-900 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-white mb-1">
                Tournament Reminders
              </h3>
              <p className="text-xs text-neutral-500">
                Get notified before tournaments start
              </p>
            </div>
            <button
              onClick={() =>
                setNotifications({
                  ...notifications,
                  tournamentReminders: !notifications.tournamentReminders,
                })
              }
              className={clsx(
                "w-12 h-6 rounded-full transition-colors relative",
                notifications.tournamentReminders
                  ? "bg-blue-600"
                  : "bg-neutral-800",
              )}
            >
              <div
                className={clsx(
                  "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform",
                  notifications.tournamentReminders
                    ? "translate-x-6"
                    : "translate-x-0.5",
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-black border border-neutral-900 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-white mb-1">
                Friend Requests
              </h3>
              <p className="text-xs text-neutral-500">
                Notifications when you receive friend requests
              </p>
            </div>
            <button
              onClick={() =>
                setNotifications({
                  ...notifications,
                  friendRequests: !notifications.friendRequests,
                })
              }
              className={clsx(
                "w-12 h-6 rounded-full transition-colors relative",
                notifications.friendRequests ? "bg-blue-600" : "bg-neutral-800",
              )}
            >
              <div
                className={clsx(
                  "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform",
                  notifications.friendRequests
                    ? "translate-x-6"
                    : "translate-x-0.5",
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-black border border-neutral-900 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-white mb-1">
                Game Results
              </h3>
              <p className="text-xs text-neutral-500">
                Receive detailed game analysis after matches
              </p>
            </div>
            <button
              onClick={() =>
                setNotifications({
                  ...notifications,
                  gameResults: !notifications.gameResults,
                })
              }
              className={clsx(
                "w-12 h-6 rounded-full transition-colors relative",
                notifications.gameResults ? "bg-blue-600" : "bg-neutral-800",
              )}
            >
              <div
                className={clsx(
                  "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform",
                  notifications.gameResults
                    ? "translate-x-6"
                    : "translate-x-0.5",
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Game Preferences */}
      <Card className="bg-[#0a0a0a] border-neutral-900">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-white">Game Preferences</CardTitle>
              <CardDescription className="text-neutral-500">
                Customize your gameplay experience
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-white mb-3">Board Theme</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  id: "classic",
                  name: "Classic",
                  colors: ["bg-amber-100", "bg-amber-800"],
                },
                {
                  id: "modern",
                  name: "Modern",
                  colors: ["bg-blue-100", "bg-blue-900"],
                },
                {
                  id: "neon",
                  name: "Neon",
                  colors: ["bg-purple-500", "bg-black"],
                },
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setBoardTheme(theme.id)}
                  className={clsx(
                    "p-3 rounded-lg border transition-all",
                    boardTheme === theme.id
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-neutral-900 bg-black hover:border-neutral-700",
                  )}
                >
                  <div className="flex gap-1 mb-2">
                    {theme.colors.map((color, i) => (
                      <div key={i} className={clsx("w-6 h-6 rounded", color)} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-neutral-300">
                      {theme.name}
                    </p>
                    {boardTheme === theme.id && (
                      <Check className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-white mb-3">Piece Set</h3>
            <div className="grid grid-cols-3 gap-3">
              {["Classic", "Modern", "Minimal"].map((set) => (
                <button
                  key={set}
                  onClick={() => setPieceSet(set.toLowerCase())}
                  className={clsx(
                    "p-4 rounded-lg border transition-all",
                    pieceSet === set.toLowerCase()
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-neutral-900 bg-black hover:border-neutral-700",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-neutral-300">
                      {set}
                    </p>
                    {pieceSet === set.toLowerCase() && (
                      <Check className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-black border border-neutral-900 rounded-lg">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-neutral-400" />
              <div>
                <h3 className="text-sm font-medium text-white mb-1">
                  Sound Effects
                </h3>
                <p className="text-xs text-neutral-500">
                  Play sounds during moves and captures
                </p>
              </div>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={clsx(
                "w-12 h-6 rounded-full transition-colors relative",
                soundEnabled ? "bg-blue-600" : "bg-neutral-800",
              )}
            >
              <div
                className={clsx(
                  "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform",
                  soundEnabled ? "translate-x-6" : "translate-x-0.5",
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card className="bg-[#0a0a0a] border-neutral-900">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <CardTitle className="text-white">Privacy & Security</CardTitle>
              <CardDescription className="text-neutral-500">
                Manage your privacy settings
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-black border border-neutral-900 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-white mb-1">
                Profile Visibility
              </h3>
              <p className="text-xs text-neutral-500">
                Control who can view your profile
              </p>
            </div>
            <select className="bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50">
              <option>Everyone</option>
              <option>Friends Only</option>
              <option>Private</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-black border border-neutral-900 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-white mb-1">
                Match History
              </h3>
              <p className="text-xs text-neutral-500">
                Control who can view your game history
              </p>
            </div>
            <select className="bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50">
              <option>Everyone</option>
              <option>Friends Only</option>
              <option>Private</option>
            </select>
          </div>

          <button className="w-full bg-red-950/30 hover:bg-red-900/40 text-red-500 font-medium py-3 px-6 rounded-lg border border-red-900/30 transition-colors text-sm">
            Delete Account
          </button>
        </CardContent>
      </Card>

      {/* Language & Region */}
      <Card className="bg-[#0a0a0a] border-neutral-900">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <CardTitle className="text-white">Language & Region</CardTitle>
              <CardDescription className="text-neutral-500">
                Set your language and timezone preferences
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-400">
              Language
            </label>
            <select className="w-full bg-black border border-neutral-800 text-neutral-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500/50">
              <option>English</option>
              <option>Polish</option>
              <option>Spanish</option>
              <option>German</option>
              <option>French</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-400">
              Timezone
            </label>
            <select className="w-full bg-black border border-neutral-800 text-neutral-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500/50">
              <option>UTC+1 (Warsaw)</option>
              <option>UTC+0 (London)</option>
              <option>UTC-5 (New York)</option>
              <option>UTC+9 (Tokyo)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4 pt-4">
        <button className="bg-transparent hover:bg-neutral-900 text-neutral-300 font-medium py-3 px-8 rounded-lg border border-neutral-800 transition-colors">
          Cancel
        </button>
        <button className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-8 rounded-lg transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );
}
