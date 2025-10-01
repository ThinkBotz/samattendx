export function useRegisterSW() {
  const tuple = [false as unknown as boolean, (_v: boolean) => {}] as const;
  return {
    needRefresh: tuple,
    offlineReady: tuple,
    updateServiceWorker: (_reload?: boolean) => {},
  } as const;
}

export default { useRegisterSW };