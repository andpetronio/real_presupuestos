export type UIState = 'loading' | 'empty' | 'error' | 'success';

export interface OperatorMessage {
  kind: UIState;
  title: string;
  detail?: string;
  actionLabel?: string;
}
