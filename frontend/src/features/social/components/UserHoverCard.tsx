import {
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { MapPin } from "lucide-react";
import { usePublicUserProfile } from "../hooks/usePublicUserProfile";
import { resolveMediaUrl } from "../../../utils/utils";
import playerAvatar from "../../../assets/avatar_1.png";



interface UserHoverCardProps {
  userId: number;
  isOnline: boolean;
  className?: string;
  children: ReactNode;
}


interface UserHoverCardContentProps {
  userId: number;
  isOnline: boolean;
  top: number;
  left: number;
}


const CARD_WIDTH = 256;
const CARD_MAX_HEIGHT = 280;
const CARD_GAP = 8;
const VIEWPORT_PADDING = 8;


function UserHoverCardContent({
  userId,
  isOnline,
  top,
  left,
}: UserHoverCardContentProps) {
  const {
    profile,
    isLoading,
    errorMessage,
  } = usePublicUserProfile(userId);


  if (isLoading) {
    return (
      <div
        role="tooltip"
        style={{
          top,
          left,
          width: CARD_WIDTH,
        }}
        className="fixed z-[100] pointer-events-none rounded-xl border border-neutral-800 bg-[#0a0a0a] p-4 shadow-2xl"
      >
        <p className="text-xs text-neutral-500">
          Loading profile...
        </p>
      </div>
    );
  }


  if (errorMessage || !profile) {
    return (
      <div
        role="tooltip"
        style={{
          top,
          left,
          width: CARD_WIDTH,
        }}
        className="fixed z-[100] pointer-events-none rounded-xl border border-neutral-800 bg-[#0a0a0a] p-4 shadow-2xl"
      >
        <p className="text-xs text-red-400">
          {errorMessage ?? "Profile unavailable"}
        </p>
      </div>
    );
  }


  // Prefer an uploaded avatar and fall back to the OAuth avatar when available
  const avatarUrl =
    resolveMediaUrl(profile.profile.avatar) ||
    profile.profile.oauth_avatar_url ||
    playerAvatar;


  return (
    <div
      role="tooltip"
      style={{
        top,
        left,
        width: CARD_WIDTH,
      }}
      className="fixed z-[100] pointer-events-none rounded-xl border border-neutral-800 bg-[#0a0a0a] p-4 shadow-2xl"
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${profile.username} avatar`}
              className="h-11 w-11 rounded-full border border-neutral-800 object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900 text-sm font-bold text-neutral-400">
              {profile.username
                .charAt(0)
                .toUpperCase()}
            </div>
          )}

          <div
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#0a0a0a] ${
              isOnline
                ? "bg-green-500"
                : "bg-neutral-600"
            }`}
          />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-neutral-200">
            {profile.username}
          </p>

          <p
            className={`text-xs ${
              isOnline
                ? "text-green-500"
                : "text-neutral-600"
            }`}
          >
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>


      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-neutral-900/70 p-2 text-center">
          <p className="text-[10px] uppercase text-neutral-600">
            ELO
          </p>
          <p className="text-xs font-medium text-neutral-300">
            {profile.profile.elo_rating}
          </p>
        </div>

        <div className="rounded-lg bg-neutral-900/70 p-2 text-center">
          <p className="text-[10px] uppercase text-neutral-600">
            Peak
          </p>
          <p className="text-xs font-medium text-neutral-300">
            {profile.profile.peak_rating}
          </p>
        </div>

        <div className="rounded-lg bg-neutral-900/70 p-2 text-center">
          <p className="text-[10px] uppercase text-neutral-600">
            Games
          </p>
          <p className="text-xs font-medium text-neutral-300">
            {profile.profile.total_games}
          </p>
        </div>
      </div>


      <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-500">
        <span>
          W {profile.profile.wins}
        </span>
        <span>
          L {profile.profile.losses}
        </span>
        <span>
          D {profile.profile.draws}
        </span>
        <span>
          Streak {profile.profile.current_streak}
        </span>
      </div>


      {profile.profile.location && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-neutral-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" />

          <span className="truncate">
            {profile.profile.location}
          </span>
        </div>
      )}


      {profile.profile.bio && (
        <p className="mt-3 max-h-16 overflow-hidden text-xs leading-5 text-neutral-400">
          {profile.profile.bio}
        </p>
      )}
    </div>
  );
}


export function UserHoverCard({
  userId,
  isOnline,
  className,
  children,
}: UserHoverCardProps) {
  const triggerRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);


  const openCard = () => {
    const trigger = triggerRef.current;

    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();

    // Keep the hover card inside the viewport and place it left of the sidebar
    const left = Math.max(
      VIEWPORT_PADDING,
      rect.left - CARD_WIDTH - CARD_GAP,
    );

    const maxTop = Math.max(
      VIEWPORT_PADDING,
      window.innerHeight -
        CARD_MAX_HEIGHT -
        VIEWPORT_PADDING,
    );

    const top = Math.min(
      Math.max(rect.top, VIEWPORT_PADDING),
      maxTop,
    );

    setPosition({
      top,
      left,
    });
  };


  const closeCard = () => {
    setPosition(null);
  };


  return (
    <div
      ref={triggerRef}
      onMouseEnter={openCard}
      onMouseLeave={closeCard}
      className={className}
    >
      {children}

      {position &&
        createPortal(
          <UserHoverCardContent
            userId={userId}
            isOnline={isOnline}
            top={position.top}
            left={position.left}
          />,
          document.body,
        )}
    </div>
  );
}