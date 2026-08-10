import { useGlobalChat } from "../../chat/context/GlobalChatProvider";


export function LoggedUsersPanel() {
  const {
    onlineUsers,
    connectionState,
  } = useGlobalChat();

  if (connectionState !== "connected") {
    return (
      <p className="px-2 py-2 text-xs text-neutral-600">
        Logged users unavailable
      </p>
    );
  }

  if (onlineUsers.length === 0) {
    return (
      <p className="px-2 py-2 text-xs text-neutral-600">
        No logged users
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {onlineUsers.map((onlineUser) => (
        <div
          key={onlineUser.id}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-900/50 transition-colors group"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-500">
              {onlineUser.username
                .charAt(0)
                .toUpperCase()}
            </div>

            {/* Every listed user has an active authenticated socket */}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#050505] bg-green-500" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-400 group-hover:text-neutral-200 truncate transition-colors">
              {onlineUser.username}
            </p>

            <p className="text-xs text-green-600">
              Online
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}