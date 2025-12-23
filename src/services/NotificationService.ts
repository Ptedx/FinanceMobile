import NotificationReader, { NotificationEvent } from '../../modules/notification-reader';
import { APIDatabaseService } from './APIDatabaseService';
import { shouldProcessNotification } from './notificationFilter';
import { Alert } from 'react-native';

class NotificationService {
  private apiService: APIDatabaseService;
  private isListening: boolean = false;

  constructor() {
    this.apiService = new APIDatabaseService();
  }

  async init() {
    if (this.isListening) return;

    try {
      const hasPermission = await NotificationReader.checkPermissions();
      if (!hasPermission) {
        // We can't ask directly in background usually, but here we can
        // The UI should handle the "Request Permission" flow, but we can verify here
        console.log('Notification permission not granted.');
        return;
      }

      NotificationReader.addNotificationListener(this.handleNotification);
      this.isListening = true;
      console.log('Notification Listener initialized.');
    } catch (error) {
      console.error('Failed to init notification service:', error);
    }
  }

  requestPermission = async () => {
    return NotificationReader.requestPermissions();
  }

  private handleNotification = async (event: NotificationEvent) => {
    console.log('Notification received:', event);

    const fullText = (event.title + " " + (event.bigText || event.text || "")).trim();
    
    if (shouldProcessNotification(event.packageName, fullText)) {
      console.log('Processing relevant notification from:', event.packageName);
      
      try {
        const result = await this.apiService.categorizeNotification(fullText, event.packageName, event.timestamp);
        
        if (result && result.success && result.transaction) {
            console.log('Transaction automatically added:', result.transaction);
            
            // Atualizar a store localmente para aparecer na hora SEM chamar API de novo
            const { transaction } = result;
            const useFinanceStore = require('../store/financeStore').useFinanceStore;
            
            useFinanceStore.setState((state: any) => {
                 // Expenses usually have paymentMethod or negative value logic, 
                 // but since we return the saved object from backend, we can check properties.
                 // Simplest heuristic: if it has paymentMethod, it's an expense.
                 if (transaction.paymentMethod) {
                     return { expenses: [transaction, ...state.expenses] };
                 } else {
                     return { incomes: [transaction, ...state.incomes] };
                 }
            });
        }
      } catch (error) {
        console.error('Error processing notification with AI:', error);
      }
    } else {
        console.log(`Notification ignored by filter: [${event.packageName}] - "${fullText}"`);
    }
  }
}

export const notificationService = new NotificationService();
