import { Platform } from 'react-native';
import { IDatabaseService } from './IDatabaseService';
import WebDatabaseService from './WebDatabaseService';

let databaseInstance: IDatabaseService | null = null;

// Synchronous initialization for web, async for native
if (Platform.OS === 'web') {
  databaseInstance = new WebDatabaseService();
  console.log('Using Web Database Service');
}

export function getDatabaseSync(): IDatabaseService {
  if (!databaseInstance) {
    if (Platform.OS !== 'web') {
      // For native, we need to use dynamic import
      const SQLiteDatabaseService = require('./SQLiteDatabaseService').default;
      databaseInstance = new SQLiteDatabaseService();
      console.log('Using SQLite Database Service');
    } else {
      throw new Error('Database should be initialized for web');
    }
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
