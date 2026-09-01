import { useState, useEffect, useRef } from "react";
import { MessageSquare, Users, ChevronDown, ChevronUp } from "lucide-react";
import { GlobalChatPanel } from "../../features/chat/components/GlobalChatPanel";
import { useGlobalChat } from "../../features/chat/context/GlobalChatProvider";
import { LoggedUsersPanel } from "../../features/social/components/LoggedUsersPanel";
import { UserHoverCard } from "../../features/social/components/UserHoverCard";
import { useFriends } from "../../features/social/hooks/useFriends";
import clsx from "clsx";

export function SocialSidebar() {
  const [isChatOpen, setIsChatOpen] = useState(true);

  const [activeSocialTab, setActiveSocialTab] = useState<"friends" | "logged">(
    "friends",
  );

  const {
    onlineUsers,
    friendsRevision,
    friendshipChangeRevision,
  } = useGlobalChat();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  //const isFirstRender = useRef(true); // Prevents the toast from popping up on initial page load
  const lastFriendshipChangeRevisionRef =
    useRef(friendshipChangeRevision);

  useEffect(() => {
    if (
      friendshipChangeRevision ===
      lastFriendshipChangeRevisionRef.current
    ) {
      return;
    }

    lastFriendshipChangeRevisionRef.current =
      friendshipChangeRevision;

    if (friendshipChangeRevision === 0) {
      return;
    }

    // Show the banner only for a friendship revision received after this sidebar mounted
    setToastMessage(
      "Your friends list has been updated!",
    );

    const timer = window.setTimeout(
      () => setToastMessage(null),
      3000,
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [friendshipChangeRevision]);

  // Load friendship data from Django and refresh it after realtime invalidation
  const {
    friends,
    isLoading: areFriendsLoading,
    errorMessage: friendsErrorMessage,
    pendingFriendId,
    actionErrorMessage,
    addFriend,
    removeFriend,
  } = useFriends(friendsRevision);

  return (
    <aside className="w-72 bg-[#050505] border-l border-neutral-900 flex flex-col h-full">
      <div className="p-4 border-b border-neutral-900 flex items-center gap-2 text-neutral-300 font-medium text-sm">
        <Users className="w-4 h-4 text-purple-500" />
        Social Hub
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            aria-pressed={activeSocialTab === "friends"}
            onClick={() => setActiveSocialTab("friends")}
            className={clsx(
              "px-2 py-2 rounded-md text-xs font-medium transition-colors",
              activeSocialTab === "friends"
                ? "bg-neutral-800 text-neutral-200"
                : "text-neutral-600 hover:text-neutral-300 hover:bg-neutral-900/50",
            )}
          >
            Friends
          </button>

          <button
            type="button"
            aria-pressed={activeSocialTab === "logged"}
            onClick={() => setActiveSocialTab("logged")}
            className={clsx(
              "px-2 py-2 rounded-md text-xs font-medium transition-colors",
              activeSocialTab === "logged"
                ? "bg-neutral-800 text-neutral-200"
                : "text-neutral-600 hover:text-neutral-300 hover:bg-neutral-900/50",
            )}
          >
            Logged Users
          </button>
        </div>

        {actionErrorMessage && (
          <p className="px-2 text-xs text-red-400">{actionErrorMessage}</p>
        )}

        {activeSocialTab === "friends" && (
          <div className="space-y-1">
            {areFriendsLoading && (
              <p className="px-2 py-2 text-xs text-neutral-600">
                Loading friends...
              </p>
            )}

            {friendsErrorMessage && (
              <p className="px-2 py-2 text-xs text-neutral-600">
                {friendsErrorMessage}
              </p>
            )}

            {!areFriendsLoading &&
              !friendsErrorMessage &&
              friends.length === 0 && (
                <p className="px-2 py-2 text-xs text-neutral-600">
                  No friends yet
                </p>
              )}

            {!friendsErrorMessage &&
              friends.map((friend) => {
                // Presence changes only the status and never filters the friends list
                const isOnline = onlineUsers.some(
                  (onlineUser) => onlineUser.id === friend.id,
                );

                return (
                  <UserHoverCard
                    key={friend.id}
                    userId={friend.id}
                    isOnline={isOnline}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-900/50 cursor-pointer transition-colors group"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-500">
                        {friend.username.charAt(0)}
                      </div>

                      <div
                        className={clsx(
                          "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#050505]",
                          isOnline ? "bg-green-500" : "bg-neutral-600",
                        )}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-400 group-hover:text-neutral-200 truncate transition-colors">
                        {friend.username}
                      </p>

                      <p className="text-xs text-neutral-600">
                        ELO {friend.profile.elo_rating}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={pendingFriendId !== null}
                      onClick={() => {
                        void removeFriend(friend.id);
                      }}
                      className="shrink-0 rounded-md border border-neutral-800 px-2 py-1 text-[10px] font-medium text-neutral-500 transition-colors hover:border-red-900 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {pendingFriendId === friend.id ? "Removing..." : "Remove"}
                    </button>
                  </UserHoverCard>
                );
              })}
          </div>
        )}

        {activeSocialTab === "logged" && (
          <LoggedUsersPanel
            friends={friends}
            friendActionsAvailable={!areFriendsLoading && !friendsErrorMessage}
            pendingFriendId={pendingFriendId}
            onAddFriend={addFriend}
          />
        )}
      </div>

      {/* Chat Section */}
      <div className="bg-black border-t border-neutral-900 flex flex-col">
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="flex items-center justify-between p-4 hover:bg-neutral-900 transition-colors w-full"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-300">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            Global Chat
          </div>

          {isChatOpen ? (
            <ChevronDown className="w-4 h-4 text-neutral-600" />
          ) : (
            <ChevronUp className="w-4 h-4 text-neutral-600" />
          )}
        </button>

        <div className={clsx("h-72 flex-col", isChatOpen ? "flex" : "hidden")}>
          {/*Keep the panel mounted so collapsing the sidebar does not close the socket */}
          <GlobalChatPanel />
        </div>
      </div>
      {/* ... Chat Section ... */}
      <div className="bg-black border-t border-neutral-900 flex flex-col">
        {/* ... chat buttons and panel ... */}
      </div>

      {/* THE CUSTOM TOAST NOTIFICATION  */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-blue-950/90 border border-blue-500/50 text-blue-200 px-6 py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center gap-3 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping absolute top-3 right-3"></span>
            <div className="w-8 h-8 bg-blue-900/50 rounded-lg flex items-center justify-center border border-blue-700/50 text-lg">
              🔔
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Social Update</h4>
              <p className="text-sm font-medium opacity-80">{toastMessage}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
