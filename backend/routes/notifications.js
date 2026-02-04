import express from 'express';
import { 
  getNotifications, 
  markAllAsRead, 
  markAsRead, 
  addNotification, 
  deleteNotification,
  clearAllNotifications,
  getNotificationSettings,
  updateNotificationSettings
} from '../controllers/notificationsController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(verifyToken);

// Get notification settings
router.get('/settings', getNotificationSettings);

// Update notification settings
router.put('/settings', updateNotificationSettings);

// Get all notifications for the user
router.get('/', getNotifications);

// Mark all notifications as read
router.put('/mark-all-read', markAllAsRead);

// Mark specific notification as read
router.put('/:notificationId/read', markAsRead);

// Add a new notification
router.post('/', addNotification);

// Delete a specific notification
router.delete('/:notificationId', deleteNotification);

// Clear all notifications
router.delete('/', clearAllNotifications);

export default router;
