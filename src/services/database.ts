import { Platform } from 'react-native';
import { IDatabaseService } from './IDatabaseService';
import { APIDatabaseService } from './APIDatabaseService';

let databaseInstance: IDatabaseService | null = null;

export function getDatabaseSync(): IDatabaseService {
  if (!databaseInstance) {
    databaseInstance = new APIDatabaseService();
    console.log('Using API Database Service');
  }
  return databaseInstance;
}

export const db = new Proxy({} as IDatabaseService, {
  get: (_target, prop) => {
    const database = getDatabaseSync();
    const value = (database as any)[prop];
    if (typeof value === 'function') {
      return value.bind(database);
    }
    return value;
  }
});

export { IDatabaseService };
