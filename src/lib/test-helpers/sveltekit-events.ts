export const asLoadEvent = <T extends (event: any) => any>(
  event: unknown,
): Parameters<T>[0] => event as Parameters<T>[0];

export const asActionEvent = <T extends (event: any) => any>(
  event: unknown,
): Parameters<T>[0] => event as Parameters<T>[0];
