const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  owner: {
    id: { type: String, required: true },
    name: String
  },
  taskGroup: { type: String },
  taskName: { type: String },
  description: { type: String },
  audioFile: { type: String },
  pdfFile: { type: String },
  people: [{ userId: String, name: String }],
  startDate: { type: String },
  endDate: { type: String },
  reminder: { type: String },
  status: { type: String },
  category: { type: String },
  comment: { type: String },
  remark: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
