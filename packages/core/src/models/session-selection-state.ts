export class SessionSelectionState {
  constructor(
    public sessionId: string,
    public isSelected: boolean,
    public menuX: number,
    public menuY: number,
    public isContextualMenuOpen: boolean
  ) {}
}
