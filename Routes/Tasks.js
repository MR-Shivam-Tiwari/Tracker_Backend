const express = require("express");
const Task = require("../modules/TaskSchema");
const app = express.Router();

// Get all tasks
app.get("/tasks", async (req, res) => {
  try {
    const taskGroups = await Task.find().sort({ createdAt: -1 });
    res.json(taskGroups);
  } catch (error) {
    console.error("Error fetching tasks:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update task status by taskId
app.put("/tasks/:taskId/status", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!["", "In Progress", "Completed", "Cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: { status } },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(updatedTask);
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Count completed tasks for a user
app.get("/countCompletedTasks/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "UserId is required" });
    }

    const completedCountQuery = {
      "people.userId": userId,
      status: "Completed",
    };

    const totalCountQuery = { "people.userId": userId };

    const completedCount = await Task.countDocuments(completedCountQuery);
    const totalCount = await Task.countDocuments(totalCountQuery);

    res.json({ completedCount, totalCount });
  } catch (error) {
    console.error("Error fetching completed task count:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Count tasks by group
app.get("/countTasksByGroup/:taskGroupName", async (req, res) => {
  try {
    const { taskGroupName } = req.params;

    const completedCount = await Task.countDocuments({
      taskGroup: taskGroupName,
      status: "Completed",
    });

    const totalCount = await Task.countDocuments({ taskGroup: taskGroupName });

    res.json({ completedCount, totalCount });
  } catch (error) {
    console.error("Error fetching task count by group:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update task category by taskId
app.put("/category/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { categoryAction, remark } = req.body;

    let status;
    let category;
    if (categoryAction === "Approved") {
      status = "Completed";
      category = "Approved";
    } else if (categoryAction === "Unapproved") {
      status = "In Progress";
      category = "Unapproved";
    } else {
      return res.status(400).json({ message: "Invalid category action" });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: { category, status, remark } },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(updatedTask);
  } catch (error) {
    console.error("Error updating task category:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = app;
