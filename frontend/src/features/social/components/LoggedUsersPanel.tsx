import { useGlobalChat } from "../../chat/context/GlobalChatProvider";
import type { Friend } from "../hooks/useFriends";
import { UserHoverCard } from "./UserHoverCard";

interface LoggedUsersPanelProps {
  friends: Friend[];
  friendActionsAvailable: boolean;
  pendingFriendId: number | null;
  onAddFriend: (userId: number) => Promise<void>;
}

export function LoggedUsersPanel({
  friends,
  friendActionsAvailable,
  pendingFriendId,
  onAddFriend,
}: LoggedUsersPanelProps) {
  const {
    onlineUsers,
    connectionState,
    authenticatedUser,
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
      {onlineUsers.map((onlineUser) => {
        // Match WebSocket presence with Django friendship by the backend user ID
        const isFriend = friends.some(
          (friend) => friend.id === onlineUser.id,
        );

        const isCurrentUser =
          authenticatedUser?.id === onlineUser.id;

        const isPending =
          pendingFriendId === onlineUser.id;

        return (
          <UserHoverCard
              key={onlineUser.id}
              userId={onlineUser.id}
              isOnline={true}
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
            {friendActionsAvailable &&
              authenticatedUser !== null &&
              !isCurrentUser &&
              (isFriend ? (
                <span className="shrink-0 text-[10px] font-medium text-neutral-600">
                  Friend
                </span>
              ) : (
                <button
                  type="button"
                  disabled={pendingFriendId !== null}
                  onClick={() => {
                    void onAddFriend(onlineUser.id);
                  }}
                  className="shrink-0 rounded-md border border-neutral-800 px-2 py-1 text-[10px] font-medium text-neutral-500 transition-colors hover:border-green-900 hover:text-green-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? "Adding..." : "Add"}
                </button>
              ))}
          </UserHoverCard>
        );
      })}
    </div>
  );
}