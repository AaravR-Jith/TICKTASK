// Service Worker for persistent notifications (sw.js)

self.addEventListener('install', event => {
    console.log('Service Worker installing.');
    // Skip the waiting phase and activate immediately
    self.skipWaiting();
  });
  
  self.addEventListener('activate', event => {
    console.log('Service Worker activating.');
    // Take control of all clients immediately
    event.waitUntil(clients.claim());
  });
  
  self.addEventListener('notificationclick', event => {
    console.log('Notification clicked.');
    event.notification.close();
    
    // Focus or open the app window
    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then(clientList => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window found, open a new one
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  });
  
  self.addEventListener('push', event => {
    console.log('Push notification received.');
    
    // Parse the push data (assuming it's JSON)
    let pushData = {};
    try {
      pushData = event.data.json();
    } catch (e) {
      pushData = {
        title: 'Reminder',
        body: event.data.text() || 'You have a task reminder'
      };
    }
  
    // Show the notification
    event.waitUntil(
      self.registration.showNotification(pushData.title || 'Task Reminder', {
        body: pushData.body || 'You have a task reminder',
        icon: pushData.icon || '/assets/notification-icon.png',
        badge: '/assets/badge.png',
        vibrate: [200, 100, 200],
        data: pushData.url || '/'
      })
    );
  });
  
  self.addEventListener('pushsubscriptionchange', event => {
    console.log('Push subscription changed.');
    // This would be where you'd typically update your server with the new subscription
    event.waitUntil(
      Promise.resolve()
      // Add your subscription update logic here
    );
  });