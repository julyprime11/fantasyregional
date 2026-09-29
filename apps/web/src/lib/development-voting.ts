import "server-only";

export function isDevelopmentVotingEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}
