import type {
  LeaderboardPlayer,
} from "./types";


interface LeaderboardTableProps {
  topPlayers: LeaderboardPlayer[];
  currentUser: LeaderboardPlayer | null;
}


function LeaderboardRow({
  player,
}: {
  player: LeaderboardPlayer;
}) {
  return (
    <div
      className={[
        "grid min-w-[680px] grid-cols-[70px_minmax(180px,1fr)_100px_100px_100px_110px] items-center gap-4 border-b border-neutral-900 px-5 py-4 last:border-b-0",
        player.is_current_user
          ? "bg-purple-500/10 ring-1 ring-inset ring-purple-400/30"
          : "bg-transparent",
      ].join(" ")}
    >
      <span className="font-semibold text-neutral-300">
        #{player.rank}
      </span>

      {/* <span className="truncate font-medium text-neutral-100">
        {player.username}
      </span> */}
      <span
        className={[
          "truncate font-medium",
          player.is_current_user
            ? "text-purple-200"
            : "text-neutral-100",
        ].join(" ")}
      >
        {player.username}
      </span>

      <span className="text-neutral-300">
        {player.elo_rating}
      </span>

      <span className="text-neutral-400">
        {player.total_games}
      </span>

      <span className="text-neutral-400">
        {player.wins}
      </span>

      <span className="text-neutral-400">
        {player.win_rate.toFixed(1)}%
      </span>
    </div>
  );
}


function LeaderboardHeader() {
  return (
    <div className="grid min-w-[680px] grid-cols-[70px_minmax(180px,1fr)_100px_100px_100px_110px] gap-4 border-b border-neutral-800 bg-neutral-950 px-5 py-3 text-xs font-medium uppercase tracking-wide text-purple-400">
      <span>Rank</span>
      <span>Player</span>
      <span>ELO</span>
      <span>Games</span>
      <span>Wins</span>
      <span>Win Rate</span>
    </div>
  );
}


export function LeaderboardTable({
  topPlayers,
  currentUser,
}: LeaderboardTableProps) {
  const currentUserIsOutsideTopTen =
    currentUser !== null &&
    currentUser.rank > 10;

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-neutral-900 bg-[#0a0a0a]">
        <LeaderboardHeader />

        {topPlayers.map((player) => (
          <LeaderboardRow
            key={player.user_id}
            player={player}
          />
        ))}
      </div>

      {currentUserIsOutsideTopTen && (
        <div className="mt-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Your position
          </p>

          <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-[#0a0a0a]">
            <LeaderboardRow
              player={currentUser}
            />
          </div>
        </div>
      )}
    </div>
  );
}