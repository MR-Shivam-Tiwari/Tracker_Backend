const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['unread', 'read'], default: 'unread' }, // Assuming status can be either 'unread' or 'read'
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the user model
  owner: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the user model
    name: { type: String, required: true }
  }, // Assuming 'owner' is a property in the notification
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }, // Reference to the task model if applicable
  created: { type: Date, default: Date.now },
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
