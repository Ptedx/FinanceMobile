package expo.modules.notificationreader

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.content.ComponentName
import android.os.Bundle
import android.app.Notification

class NotificationReaderModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("NotificationReader")

    Events("onNotificationReceived")

    Function("requestPermissions") {
      val context = appContext.reactContext
      if (context != null) {
        val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
      }
      return@Function null
    }

    Function("checkPermissions") {
      val context = appContext.reactContext ?: return@Function false
      val packageName = context.packageName
      val flat = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners")
      return@Function flat != null && flat.contains(packageName)
    }

    OnCreate {
      instance = this@NotificationReaderModule
    }

    OnDestroy {
      instance = null
    }
  }

  fun sendNotificationEvent(data: Map<String, Any?>) {
    this@NotificationReaderModule.sendEvent("onNotificationReceived", data)
  }

  companion object {
    var instance: NotificationReaderModule? = null
    
    fun emit(data: Map<String, Any?>) {
      instance?.sendNotificationEvent(data)
    }
  }
}
