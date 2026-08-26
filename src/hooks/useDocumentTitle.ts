import { useEffect } from 'react';
import { APP_NAME } from '@/config/app';

export function useDocumentTitle(pageTitle?: string): void {
  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} — ${APP_NAME}` : APP_NAME;
  }, [pageTitle]);
}
