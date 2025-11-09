import { useOutletContext } from 'react-router-dom';
import { SkillsOverview } from '@/features/skills';
import type { AppOutletContext } from '../types';

export default function SkillsPage() {
  const { openUploadDialog } = useOutletContext<AppOutletContext>();

  return <SkillsOverview onRequestUpload={openUploadDialog} />;
}

