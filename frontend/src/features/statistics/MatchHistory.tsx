import type {
  MatchResult,
  StatisticsMatchHistoryItem,
} from "./types";


interface MatchHistoryProps {
  username: string;
  matches: StatisticsMatchHistoryItem[];
  isLoading: boolean;
  errorMessage: string | null;
}


const RESULT_STYLES: Record<
  MatchResult,
  string
> = {
  win:
    "border-green-500/30 bg-green-500/10 text-green-400",
  loss:
    "border-red-500/30 bg-red-500/10 text-red-400",
  draw:
    "border-neutral-700 bg-neutral-900 text-neutral-400",
};


function formatMatchDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(new Date(value));
}


function getTournamentLabel(
  match: StatisticsMatchHistoryItem,
): string | null {
  if (match.tournament_id === null) {
    return null;
  }

  if (match.tournament_round === null) {
    return `Tournament #${match.tournament_id}`;
  }

  return (
    `Tournament #${match.tournament_id}` +
    ` · Round ${match.tournament_round}`
  );
}


function MatchHistoryRow({
  username,
  match,
}: {
  username: string;
  match: StatisticsMatchHistoryItem;
}) {
  const tournamentLabel =
    getTournamentLabel(match);

  return (
    <div className="flex min-h-16 items-center gap-4 border-b border-neutral-900 px-4 py-3 last:border-b-0">
      <span
        className={[
          "w-16 shrink-0 rounded-md border px-2 py-1 text-center text-xs font-bold uppercase",
          RESULT_STYLES[match.result],
        ].join(" ")}
      >
        {match.result}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-200">
          {username}
          <span className="mx-2 text-neutral-600">
            -
          </span>
          {match.opponentName}
        </p>
      </div>

      <time className="shrink-0 text-sm text-neutral-500">
        {formatMatchDate(
          match.played_at,
        )}
      </time>

      <div className="w-52 shrink-0 text-right">
        {tournamentLabel && (
          <span className="inline-flex rounded-md border border-blue-500/20 bg-blue-500/5 px-2.5 py-1 text-xs font-medium text-blue-400">
            {tournamentLabel}
          </span>
        )}
      </div>
    </div>
  );
}


export function MatchHistory({
  username,
  matches,
  isLoading,
  errorMessage,
}: MatchHistoryProps) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">
          Match History
        </h2>

        <p className="mt-1 text-sm text-neutral-500">
          Your completed games
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-900 bg-[#0a0a0a]">
        {isLoading && (
          <div className="p-6 text-sm text-neutral-500">
            Loading match history...
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="p-6 text-sm text-red-400">
            {errorMessage}
          </div>
        )}

        {!isLoading &&
          !errorMessage &&
          matches.length === 0 && (
            <div className="p-6 text-sm text-neutral-500">
              No completed games yet.
            </div>
          )}

        {!isLoading &&
          !errorMessage &&
          matches.map((match) => (
            <MatchHistoryRow
              key={match.game_id}
              username={username}
              match={match}
            />
          ))}
      </div>
    </section>
  );
}