'use client';
import { useRouter } from 'next/navigation';

export function useNavigate() {
  const router = useRouter();
  return (path, options) => {
    if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  };
}
