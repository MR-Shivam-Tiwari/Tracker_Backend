const mongoose = require("mongoose");

const taskGroupSchema = new mongoose.Schema({
  groupName: String,
  deptHead: [{ userId: String, name: String }],
  projectLead: [{ userId: String, name: String }],
  members: {
    type: [{
      userId: String,
      name: String
    }],
    default: undefined // Ensure default value is undefined to allow both arrays and single objects
  },
  profilePic: String,
  createdAt: Date,
});

const TGroupSchema = mongoose.model("TaskGroup", taskGroupSchema);

module.exports = TGroupSchema;
