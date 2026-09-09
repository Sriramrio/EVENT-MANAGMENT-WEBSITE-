import { appConfig } from '../config/appConfig';
import { repositories as dexieRepositories } from './dexie/repositories';
import { apiRepositories } from './api/ApiRepositories';

export const repositories = appConfig.dataMode === 'api' ? apiRepositories : dexieRepositories;
export type RepositoryBundle = typeof repositories;
