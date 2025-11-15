import { useOutletContext } from 'react-router-dom';
import { SkillsOverview } from '@/features/profile/skills';
import type { AppOutletContext } from '../types';

export default function SkillsPage() {
  const { openUploadDialog } = useOutletContext<AppOutletContext>();

  return <SkillsOverview onRequestUpload={openUploadDialog} />;
}

