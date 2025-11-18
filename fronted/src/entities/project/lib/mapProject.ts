import type { ProjectRecord } from '@/shared/api/contracts';
import type { Project } from '../model';
import { getCategoryIcon } from './categoryIcons';

const parseDate = (value?: string | null): Date | undefined => {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return undefined;
  }
  return new Date(timestamp);
};

export function mapProjectRecordToProject(record: ProjectRecord): Project {
  const { icon, gradient } = getCategoryIcon(record.category);

  return {
    id: record.id,
    title: record.title,
    category: record.category,
    tags: record.tags,
    summary: record.summary,
    icon,
    gradient,
    type: record.type,
    sourceUrl: record.sourceUrl ?? undefined,
    period: record.period ?? undefined,
    startDate: parseDate(record.startDate),
    endDate: parseDate(record.endDate),
    role: record.role ?? undefined,
    achievements: record.achievements ?? undefined,
    tools: record.tools ?? undefined,
    description: record.description ?? undefined,
    files: record.files ?? undefined,
    links: record.links ?? undefined,
  };
}


