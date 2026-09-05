(function () {
  var REMINDER_ID = 1001;

  function plugin() {
    if (
      window.Capacitor &&
      window.Capacitor.Plugins &&
      window.Capacitor.Plugins.LocalNotifications
    ) {
      return window.Capacitor.Plugins.LocalNotifications;
    }

    return null;
  }

  function isNative() {
    return !!(
      window.Capacitor &&
      typeof window.Capacitor.isNativePlatform === 'function' &&
      window.Capacitor.isNativePlatform()
    );
  }

  async function permissionState() {
    var notifications = plugin();

    if (!notifications || !isNative()) {
      return 'unavailable';
    }

    var result = await notifications.checkPermissions();

    return result.display || 'denied';
  }

  async function requestPermission() {
    var notifications = plugin();

    if (!notifications || !isNative()) {
      return {
        granted: false,
        reason: 'Notifications are available in the installed Android app only.'
      };
    }

    var current = await notifications.checkPermissions();

    if (current.display === 'granted') {
      return { granted: true };
    }

    var result = await notifications.requestPermissions();

    return {
      granted: result.display === 'granted',
      reason:
        result.display === 'granted'
          ? ''
          : 'Android notification permission was not granted.'
    };
  }

  function nextReminderDate() {
    var date = new Date();

    date.setHours(19, 25, 0, 0);

    if (date.getTime() <= Date.now()) {
      date.setDate(date.getDate() + 1);
    }

    return date;
  }

  async function scheduleDailyReadingReminder() {
    var notifications = plugin();

    if (!notifications || !isNative()) {
      return {
        ok: false,
        reason: 'Notifications are available in the installed Android app only.'
      };
    }

    await notifications.cancel({
      notifications: [{ id: REMINDER_ID }]
    });

    await notifications.schedule({
      notifications: [
        {
          id: REMINDER_ID,
          title: 'ReadQuest',
          body: 'Your next chapter is waiting. Log a little reading time today.',
          smallIcon: 'ic_stat_readquest',
          largeIcon: 'readquest_notification_logo',
          schedule: {
            at: nextReminderDate(),
            repeats: true,
            every: 'day',
            allowWhileIdle: true
          }
        }
      ]
    });

    return { ok: true };
  }

  async function cancelReadQuestNotifications() {
    var notifications = plugin();

    if (!notifications || !isNative()) {
      return { ok: true };
    }

    await notifications.cancel({
      notifications: [{ id: REMINDER_ID }]
    });

    return { ok: true };
  }

  window.ReadQuestNotifications = {
    isNative: isNative,
    permissionState: permissionState,
    requestPermission: requestPermission,
    scheduleDailyReadingReminder: scheduleDailyReadingReminder,
    cancelReadQuestNotifications: cancelReadQuestNotifications
  };
})();