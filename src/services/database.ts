import { Platform } from 'react-native';
import { IDatabaseService } from './IDatabaseService';
import WebDatabaseService from './WebDatabaseService';

let SQLiteDatabaseService: any;

if (Platform.OS !== 'web') {
  SQLiteDatabaseService = require('./SQLiteDatabaseService').default;
}

function createDatabaseService(): IDatabaseService {
  if (Platform.OS === 'web') {
    console.log('Using Web Database Service');
    return new WebDatabaseService();
  } else {
    console.log('Using SQLite Database Service');
    return new SQLiteDatabaseService();
  }
}

export const db = createDatabaseService();
