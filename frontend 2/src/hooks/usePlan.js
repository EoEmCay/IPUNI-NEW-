import useAuthStore from '../store/authStore';

export function usePlan() {
  const user = useAuthStore(s => s.user);
  const plan = user?.plan || 'free';
  return {
    plan,
    isFree: plan === 'free',
    isPro: plan === 'pro',
  };
}
