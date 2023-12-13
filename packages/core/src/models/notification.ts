export enum LeappNotificationType {
  info,
  warning,
  danger,
  success,
}

export class LeappNotification {
  constructor(
    public uuid: string,
    public type: LeappNotificationType,
    public title: string,
    public buttonActionName: string,
    public description: string,
    public read: boolean,
    public link?: string,
    public icon?: string,
    public popup?: boolean
  ) {}
}
