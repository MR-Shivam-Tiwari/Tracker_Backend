const express = require("express");
const TGroupSchema = require("../modules/TGroupSchema");
const Task = require("../modules/TaskSchema");
const LevelsRoutes = require("./RoleLevels");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const User = require("../modules/UserSchema");

const app = express.Router();
const customBodyParserMiddleware = bodyParser.json({ limit: "100mb" });

// Add a new Task Group
app.post("/tgroups", customBodyParserMiddleware, async (req, res) => {
  try {
    let { groupName, deptHead, projectLead, members, profilePic } = req.body;

    // Ensure deptHead and projectLead are single values
    deptHead = Array.isArray(deptHead) && deptHead.length > 0 ? deptHead[0] : deptHead;
    projectLead = Array.isArray(projectLead) && projectLead.length > 0 ? projectLead[0] : projectLead;

    const newTaskGroup = new TGroupSchema({
      groupName,
      deptHead,
      projectLead,
      members,
      profilePic,
      createdAt: new Date(),
    });

    const savedTaskGroup = await newTaskGroup.save();
    const allTaskGroups = await TGroupSchema.find();
    res.status(201).json({ savedTaskGroup, allTaskGroups });
  } catch (error) {
    console.error("Error adding new Task Group:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all Task Groups
app.get("/tgroups", async (req, res) => {
  try {
    const taskGroups = await TGroupSchema.find().sort({ createdAt: -1 });
    res.json(taskGroups);
  } catch (error) {
    console.error("Error fetching task groups:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get tasks by Task Group ID
app.get("/tasks/:taskGroupId", async (req, res) => {
  try {
    const taskGroupId = req.params.taskGroupId;
    const tasks = await Task.find({ "taskGroup.id": taskGroupId });
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks by Task Group ID:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update Task Group by ID
app.put("/TGroup/:TGroupId", async (req, res) => {
  const TGroupId = req.params.TGroupId;
  const { groupName, members, profilePic, deptHead, projectLead } = req.body;

  try {
    const existingTGroup = await TGroupSchema.findById(TGroupId);

    if (!existingTGroup) {
      return res.status(404).json({ message: "Task Group not found" });
    }

    const updatedDeptHeads = existingTGroup.deptHead.concat(deptHead || []);
    const updatedProjectLeads = existingTGroup.projectLead.concat(projectLead || []);
    const updatedMembers = existingTGroup.members.concat(members || []);

    const updatedTGroup = await TGroupSchema.findByIdAndUpdate(
      TGroupId,
      { groupName, members: updatedMembers, profilePic, projectLead: updatedProjectLeads, deptHead: updatedDeptHeads },
      { new: true }
    );

    res.json(updatedTGroup);
  } catch (error) {
    console.error("Error updating Task Group:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get members by Task Group ID
app.get("/members/:TGroupId", async (req, res) => {
  const TGroupId = req.params.TGroupId;

  try {
    const tgroup = await TGroupSchema.findOne({ _id: TGroupId }).populate({
      path: "members deptHead projectLead"
    });

    if (!tgroup) {
      return res.status(404).json({ message: "Task Group not found for the specified ID" });
    }

    const members = tgroup.members;
    const deptHead = tgroup.deptHead;
    const projectLead = tgroup.projectLead;

    res.json({ members, deptHead, projectLead });
  } catch (error) {
    console.error("Error fetching members by Task Group ID:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete Task Group by ID
app.delete("/delete/:TGroupId", async (req, res) => {
  const TGroupId = req.params.TGroupId;

  // Check if TGroupId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(TGroupId)) {
    return res.status(400).json({ message: "Invalid Group ID" });
  }

  try {
    const deletedTask = await TGroupSchema.findOneAndDelete({ _id: TGroupId });

    if (deletedTask) {
      res.status(200).json({ message: "Task Group deleted successfully" });
    } else {
      res.status(404).json({ message: "Task Group not found" });
    }
  } catch (error) {
    console.error("Error deleting Task Group:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/tasksByGroup", async (req, res) => {
  try {
    // Aggregate tasks by group name
    const tasksByGroup = await Task.aggregate([
      {
        $group: {
          _id: "$taskGroup", // Group by taskGroup field
          totalTasks: { $sum: 1 },
          inProgressTasks: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } },
          completedTasks: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          cancelledTasks: { $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] } }
        }
      }
    ]);


    res.json(tasksByGroup);
  } catch (error) {
    console.error("Error fetching tasks by group:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});








app.get("/allassignuser", async (req, res) => {
  try {
    // Find users with userRole equal to 3
    const specifiedUsers = await User.find({ userRole: 3 });

    // Array to store user data along with assigned task and group names
    let userData = [];

    // Iterate through specified users
    for (const user of specifiedUsers) {
      const userId = user._id;

      // Find all tasks where the specified user is assigned as a person
      const tasksForUser = await Task.find({ "people._id": userId }).populate('taskGroup', 'taskGroup');

      // Initialize arrays to store assigned task names and group data for the user
      let taskNames = [];

      // Object to store group data
      let groupData = [];

      // Iterate through tasks assigned to the user
      for (const task of tasksForUser) {
        // Collect task names
        taskNames.push(task.taskName);

        // Get the group name
        const groupName = task.taskGroup.taskGroup;

        // Check if the group name already exists in groupData array
        const groupIndex = groupData.findIndex(group => group.name === groupName);

        // If the group name doesn't exist, add it to groupData array
        if (groupIndex === -1) {
          groupData.push({
            name: groupName,
            totalTasks: 1,
            inProgressTasks: task.status === "In Progress" ? 1 : 0,
            completedTasks: task.status === "Completed" ? 1 : 0,
            cancelledTasks: task.status === "Cancelled" ? 1 : 0
          });
        } else {
          // If the group name already exists, update the task counts
          groupData[groupIndex].totalTasks++;
          if (task.status === "In Progress") groupData[groupIndex].inProgressTasks++;
          else if (task.status === "Completed") groupData[groupIndex].completedTasks++;
          else if (task.status === "Cancelled") groupData[groupIndex].cancelledTasks++;
        }
      }

      // Push user data along with assigned task names and group data to userData array
      userData.push({
        user,
        taskNames,
        groupData,
        taskCounts: {
          total: taskNames.length,
          inProgress: taskNames.filter(name => name.status === "In Progress").length,
          completed: taskNames.filter(name => name.status === "Completed").length,
          cancelled: taskNames.filter(name => name.status === "Cancelled").length
        }
      });
    }

    res.json(userData);
  } catch (error) {
    console.error("Error fetching tasks assigned to the users:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});





















module.exports = app;

