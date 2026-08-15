import { Outlet } from "react-router";
import { Sidebar } from "../pages/sidebars/Sidebar";
import { SocialSidebar } from "../pages/sidebars/SocialSidebar";
import { ActiveGamePreview } from "../features/gameplay/components/ActiveGamePreview";

export function Root() {
  return (
    <div className="flex h-screen w-full bg-black text-neutral-200 overflow-hidden font-sans selection:bg-blue-500/30">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <ActiveGamePreview />
      <SocialSidebar />
    </div>
  );
}
