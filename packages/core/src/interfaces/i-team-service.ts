export interface ITeamService {
  /**
   * Refresh the workspace state
   *
   * @param callback - function to call before refreshing the UI
   */
  refreshWorkspaceState(callback?: () => Promise<void>): Promise<void>;
}
