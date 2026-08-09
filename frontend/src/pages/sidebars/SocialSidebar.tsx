import { useState } from "react";
import { MessageSquare, Users, ChevronDown, ChevronUp } from "lucide-react"; //version for the chat
import { GlobalChatPanel } from "../../features/chat/components/GlobalChatPanel"; // version for the chat Connect the existing sidebar to the live global chat
import clsx from "clsx";

const friends = [
  { id: 1, name: "Kasparov", status: "online", elo: 2800 },
  { id: 2, name: "JPolgar", status: "online", elo: 2850 },
  { id: 3, name: "StockFish", status: "offline", elo: 2350 },
  { id: 4, name: "BotezLive", status: "online", elo: 2000 },
];

export function SocialSidebar() {
  const [isChatOpen, setIsChatOpen] = useState(true);

  return (
    <aside className="w-72 bg-[#050505] border-l border-neutral-900 flex flex-col h-full">
      <div className="p-4 border-b border-neutral-900 flex items-center gap-2 text-neutral-300 font-medium text-sm">
        <Users className="w-4 h-4 text-purple-500" />
        Social Hub
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <h3 className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-3">Friends List</h3>
          <div className="space-y-1">
            {friends.map((friend) => (
              <div key={friend.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-900/50 cursor-pointer transition-colors group">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-500">
                    {friend.name.charAt(0)}
                  </div>
                  <div
                    className={clsx(
                      "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#050505]",
                      friend.status === "online" ? "bg-green-500" : "bg-neutral-600"
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-400 group-hover:text-neutral-200 truncate transition-colors">
                    {friend.name}
                  </p>
                  <p className="text-xs text-neutral-600">ELO {friend.elo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
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
          {isChatOpen ? <ChevronDown className="w-4 h-4 text-neutral-600" /> : <ChevronUp className="w-4 h-4 text-neutral-600" />}
        </button>
        <div
          className={clsx(
            "h-72 flex-col",
            isChatOpen ? "flex" : "hidden",
          )}
        >
          {/*Keep the panel mounted so collapsing the sidebar does not close the socket */}
          <GlobalChatPanel />
        </div>
      </div>
    </aside>
  );
}
