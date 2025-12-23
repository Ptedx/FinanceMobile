package expo.modules.notificationreader

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.app.Notification

class NotificationListener : NotificationListenerService() {
  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    if (sbn == null) return

    val packageName = sbn.packageName
    val extras = sbn.notification.extras
    val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()
    val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString()
    // Try to get big text if available, usually has more details
    val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString()

    // Basic filtering to avoid spam
    if (title.isNullOrEmpty() && text.isNullOrEmpty()) return

    val finalMap = mutableMapOf<String, Any?>()
    finalMap["packageName"] = packageName
    finalMap["title"] = title
    finalMap["text"] = text
    finalMap["bigText"] = bigText
    finalMap["timestamp"] = sbn.postTime

    NotificationReaderModule.emit(finalMap)
  }

  override fun onNotificationRemoved(sbn: StatusBarNotification?) {}
}
