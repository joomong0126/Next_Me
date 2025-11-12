import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { UnauthorizedError } from '@/shared/api/errors';

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation();
  const { data, error, isFetching, isLoading } = useAuthGuard();

  const isAuthorizing = isLoading || (isFetching && !data);

  if (isAuthorizing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#FAFAFA]">
        <Loader2 className="animate-spin w-8 h-8 text-gray-500" />
        <p className="text-sm text-gray-500">접속 권한을 확인하는 중입니다...</p>
      </div>
    );
  }

  if (error instanceof UnauthorizedError) {
    const redirectTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" replace state={{ from: redirectTo }} />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2 bg-[#FAFAFA]">
        <p className="text-base font-medium text-gray-900">접속 권한 확인에 실패했습니다.</p>
        <p className="text-sm text-gray-500">잠시 후 다시 시도하거나 관리자에게 문의하세요.</p>
      </div>
    );
  }

  return <>{children}</>;
}




