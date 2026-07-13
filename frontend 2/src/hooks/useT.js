import useLangStore from '../store/langStore';

export function useT() {
  return useLangStore((s) => s.t);
}
