export type TableShellState = 'loading' | 'empty' | 'error' | 'success';

export type TableShellViewModel =
  | { kind: 'loading'; message: string }
  | { kind: 'empty'; title: string; detail?: string; actionLabel?: string }
  | { kind: 'error'; title: string; detail: string }
  | { kind: 'success' };

type Input = {
  state: TableShellState;
  loadingLabel: string;
  emptyTitle: string;
  emptyDetail?: string;
  emptyActionLabel?: string;
  errorTitle: string;
  errorDetail: string;
};

export const resolveTableShellView = (input: Input): TableShellViewModel => {
  if (input.state === 'loading') {
    return { kind: 'loading', message: input.loadingLabel };
  }

  if (input.state === 'empty') {
    return {
      kind: 'empty',
      title: input.emptyTitle,
      detail: input.emptyDetail,
      actionLabel: input.emptyActionLabel
    };
  }

  if (input.state === 'error') {
    return {
      kind: 'error',
      title: input.errorTitle,
      detail: input.errorDetail
    };
  }

  return { kind: 'success' };
};
