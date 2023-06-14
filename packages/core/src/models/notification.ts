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
    public description: string,
    public read: boolean,
    public link?: string,
    public icon?: string
  ) {}
}
