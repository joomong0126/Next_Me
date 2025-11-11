import { useEffect, useState } from 'react';

import type { UserProfile } from '../types';

const DEFAULT_PROFILE: UserProfile = {
  name: '예진',
  currentStatus: [],
  targetRoles: [],
};

export function useAssistantUserProfile(): UserProfile {
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    const savedCareerData = localStorage.getItem('careerData');
    if (!savedCareerData) return;

    try {
      const careerData = JSON.parse(savedCareerData);
      setUserProfile({
        name: DEFAULT_PROFILE.name,
        currentStatus: careerData.currentStatus || [],
        targetRoles: careerData.targetRoles || [],
      });
    } catch (error) {
      console.error('Failed to parse career data:', error);
    }
  }, []);

  return userProfile;
}


