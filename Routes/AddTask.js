const express = require("express");
const Task = require("../modules/TaskSchema");
const Notification = require("../modules/Notification");
const UserSchema = require("../modules/UserSchema");
const multer = require('multer');
const app = express.Router();
const { Expo } = require("expo-server-sdk");
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const expo = new Expo();
app.use(cors());

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'uploads/'); // Directory for file uploads
  },
  filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

// Ensure 'uploads' directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.post("/tasks", async (req, res) => {
  try {
    const { owner, taskGroup, taskName, description, audioFile, pdfFile, people, startDate, endDate, reminder, status, category, comment, remark } = req.body;

    // Extracting owner's ID
    const ownerId = owner.id;

    // Creating a new task object
    const newTask = new Task({
      owner: { id: ownerId },
      taskGroup,
      taskName,
      description,
      audioFile,
      pdfFile,
      people,
      startDate,
      endDate,
      reminder,
      status,
      category,
      comment,
      remark,
      createdAt: new Date(),
    });

    // Saving the new task
    const savedTask = await newTask.save();

    // Responding with the newly created task
    res.status(201).json({ newTask: savedTask });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



app.post("/notifications/reply", async (req, res, next) => {
  try {
    const { userId, taskId, status, comment } = req.body;

    const user = await UserSchema.findById(userId);

    const task = await Task.findById(taskId);
    const taskName = task.taskName;
    const ownerId = task.owner.id;

    let description = `Task: ${taskName}`;
    if (comment) {
      description += `\nComment: ${comment}`;
    }

    let title;
    switch (status) {
      case "Accepted":
        title = `${user.name} accepted the task`;
        break;
      case "Rejected":
        title = `${user.name} rejected the task`;
        break;
      case "Accepted & Modified":
        title = `${user.name} accepted and  modified the task`;
        break;
      default:
        title = `${user.name} responded to the task`;
    }

    const newNotification = new Notification({
      title: title,
      description: description,
      status: status,
      userid: ownerId,
      owner: user.name,
      taskId: taskId,
      created: new Date(),
    });

    await newNotification.save();
    res.status(201).json({ message: "Reply sent successfully", comment: comment });
  } catch (error) {
    console.error("Error replying to task notification:", error);
    res.status(500).json({ error: "Internal Server Error" });
    next(error);
  }
});

app.get("/notifications/:userId", async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const userNotifications = await Notification.find({ userid: userId });
    res.json(userNotifications);
  } catch (error) {
    console.error("Error retrieving user notifications:", error);
    res.status(500).json({ error: "Internal Server Error" });
    next(error);
  }
});

app.put('/tasks/update/:taskId', async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;

    const task = await Task.findByIdAndUpdate(taskId, updates, { new: true });
    if (!task) {
      return res.status(404).send({ message: 'Task not found' });
    }

    res.status(200).send(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Internal Server Error' });
    next(error);
  }
});

app.put('/notifications/:id', async (req, res, next) => {
  const { id } = req.params;
  const { title, description, status, owner, taskId } = req.body;

  try {
    const notification = await Notification.findByIdAndUpdate(id, {
      $set: {
        title,
        description,
        status,
        owner,
        taskId
      }
    }, { new: true });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
    next(error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

module.exports = app;
