import type { API } from '../../contracts';
import { auth } from './auth';
import { projects } from './projects';

export const api: API = { auth, projects };

