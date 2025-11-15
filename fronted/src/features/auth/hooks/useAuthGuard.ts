import { useUser } from './useUser';

/**
 * @deprecated useUser를 사용하세요. 이 훅은 하위 호환성을 위해 유지됩니다.
 */
export function useAuthGuard() {
  return useUser();
}