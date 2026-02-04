import User from '../models/User.js';

// Get all notifications for a user
export const getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, notifications: user.notifications || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: { 'notifications.$[].unread': false }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, notifications: user.notifications || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark specific notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: { 'notifications.$[elem].unread': false }
      },
      { 
        new: true,
        arrayFilters: [{ 'elem.id': notificationId }]
      }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, notifications: user.notifications || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add notification (can be called by backend or frontend)
export const addNotification = async (req, res) => {
  try {
    const { title, description, type = 'info' } = req.body;
    
    const notification = {
      id: `notif-${Date.now()}`,
      title,
      description,
      type,
      unread: true,
      timestamp: new Date()
    };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $push: { notifications: notification }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(201).json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $pull: { notifications: { id: notificationId } }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, notifications: user.notifications || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Clear all notifications
export const clearAllNotifications = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: { notifications: [] }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get notification settings
export const getNotificationSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('notificationSettings');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Return default settings if not set
    const settings = user.notificationSettings || {
      new_leads: true,
      new_campaigns: true,
      budget_alerts: true,
      performance_alerts: true
    };
    
    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update notification settings
export const updateNotificationSettings = async (req, res) => {
  try {
    const { new_leads, new_campaigns, budget_alerts, performance_alerts } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Initialize if undefined
    if (!user.notificationSettings) {
      user.notificationSettings = {};
    }

    // Update fields if provided
    if (new_leads !== undefined) user.notificationSettings.new_leads = new_leads;
    if (new_campaigns !== undefined) user.notificationSettings.new_campaigns = new_campaigns;
    if (budget_alerts !== undefined) user.notificationSettings.budget_alerts = budget_alerts;
    if (performance_alerts !== undefined) user.notificationSettings.performance_alerts = performance_alerts;

    await user.save();

    res.status(200).json({ 
      success: true, 
      message: 'Notification settings updated', 
      settings: user.notificationSettings 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
