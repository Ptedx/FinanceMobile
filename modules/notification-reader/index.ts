import { requireNativeModule, EventEmitter, Subscription } from 'expo-modules-core';

// Define the type for the notification event payload
export type NotificationEvent = {
  packageName: string;
  title?: string;
  text?: string;
  bigText?: string;
  timestamp: number;
};

// Interface for the native module
interface NotificationReaderModuleInterface {
  requestPermissions(): Promise<void>;
  checkPermissions(): Promise<boolean>;
}

// Get the native module
const NotificationReader = requireNativeModule<NotificationReaderModuleInterface>('NotificationReader');

// Create an event emitter
const emitter = new EventEmitter(NotificationReader);

export function addNotificationListener(
  listener: (event: NotificationEvent) => void
): Subscription {
  return emitter.addListener<NotificationEvent>('onNotificationReceived', listener);
}

export function requestPermissions(): Promise<void> {
  return NotificationReader.requestPermissions();
}

export function checkPermissions(): Promise<boolean> {
  return NotificationReader.checkPermissions();
}

export default {
  addNotificationListener,
  requestPermissions,
  checkPermissions,
};
