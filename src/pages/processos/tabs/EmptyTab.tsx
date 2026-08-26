import { EmptyState } from '@/components/ui/EmptyState/EmptyState';

interface EmptyTabProps {
  title: string;
}

export function EmptyTab({ title }: EmptyTabProps) {
  return <EmptyState title={title} description="Esta aba está pronta para integração com uma API/backend." />;
}
