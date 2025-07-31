import React, { useState, useEffect } from "react";
import moment from "moment";
import { fetchUsers } from '../services/api';

const API_URL = 'http://localhost:5000';

const compactStyles = {
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50
  },
  modal: {
    background: "#fff",
    color: "#222",
    borderRadius: 12,
    padding: 16,
    width: "95%",
    maxWidth: 350,
    fontSize: 14,
    boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
    border: "1px solid #e5e7eb"
  },
  header: {
    fontWeight: 600,
    fontSize: 16,
    marginBottom: 10
  },
  row: {
    display: "flex",
    gap: 8
  },
  col: {
    flex: 1
  },
  label: {
    display: "block",
    marginBottom: 2,
    fontWeight: 500
  },
  input: {
    width: "100%",
    padding: "4px 6px",
    borderRadius: 4,
    border: "1px solid #e5e7eb",
    marginBottom: 6,
    fontSize: 13,
    background: "#fff",
    color: "#222"
  },
  tag: {
    display: "inline-block",
    background: "#2563eb",
    color: "#fff",
    padding: "2px 8px",
    borderRadius: 12,
    fontSize: 12,
    marginRight: 4,
    marginBottom: 2
  },
  tagRemove: {
    marginLeft: 4,
    color: "#f43f5e",
    cursor: "pointer"
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8
  }
};

const AddTaskForm = ({ date, task, onClose, onAddTask }) => {
  const [peopleOptions, setPeopleOptions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [newPerson, setNewPerson] = useState("");
  const userEmail = sessionStorage.getItem('email');

  useEffect(() => {
    // Fetch people
    fetch(`${API_URL}/api/people`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load people');
        return res.json();
      })
      .then(data => setPeopleOptions(data.people || []))
      .catch(error => console.error('Error loading people:', error));

    // Fetch projects
    fetch(`${API_URL}/api/projects?user_email=${encodeURIComponent(userEmail)}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load projects');
        return res.json();
      })
      .then(data => setProjects(data.projects || []))
      .catch(error => console.error('Error loading projects:', error));
  }, [userEmail]);

  const handleAddPerson = (e) => {
    e.preventDefault();
    if (newPerson.trim()) {
      fetch(`${API_URL}/api/people`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPerson.trim() }),
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to add person');
          return res.json();
        })
        .then(data => {
          setPeopleOptions(prev => [...prev, data.person]);
          setNewPerson("");
        })
        .catch(error => console.error('Error adding person:', error));
    }
  };

  const [form, setForm] = useState(
    task || {
      title: "",
      description: "",
      involved: "",
      startTime: "",
      endTime: "",
      startDate: date || moment().format("YYYY-MM-DD"),
      endDate: "",
      priority: "Medium",
      tags: [],
      project: "",
      status: "Not Started",
      createdAt: moment().format("YYYY-MM-DD"),
      comments: [],
      attachments: [],
      recurring: false,
      reminder: false,
    }
  );

  const [tagInput, setTagInput] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleTagAdd = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(f => ({ ...f, tags: [...f.tags, tagInput.trim()] }));
      setTagInput("");
    }
  };

  const handleTagRemove = (tag) => {
    setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.endDate) return;

    let deadline = form.endDate;
    if (form.endTime) {
      deadline += 'T' + form.endTime;
    }
    if (deadline && deadline.length <= 16) {
      deadline = new Date(deadline).toISOString();
    }

    onAddTask({
      title: form.title,
      description: form.description,
      tags: form.tags,
      color: form.color || 'blue',
      deadline,
      type: 'routine task',
    });
    onClose();
  };

  return (
    <div style={compactStyles.modalOverlay}>
      <form style={compactStyles.modal} onSubmit={handleSubmit}>
        <div style={compactStyles.header}>{task ? "Edit Task" : "Add Task"}</div>

        <input
          style={compactStyles.input}
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          required
        />

        <textarea
          style={{ ...compactStyles.input, minHeight: 32, maxHeight: 60, resize: "vertical" }}
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
        />

        <div style={compactStyles.row}>
          <div style={compactStyles.col}>
            <label style={compactStyles.label}>Type</label>
            <select
              style={compactStyles.input}
              name="type"
              value={form.type || "Daily Work"}
              onChange={handleChange}
              required
            >
              <option value="Daily Work">Daily Work</option>
              <option value="Project">Project</option>
            </select>
          </div>
          <div style={compactStyles.col}>
            <label style={compactStyles.label}>Priority</label>
            <select
              style={compactStyles.input}
              name="priority"
              value={form.priority}
              onChange={handleChange}
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
        </div>

        <div style={compactStyles.row}>
          <div style={compactStyles.col}>
            <label style={compactStyles.label}>People</label>
            <select
              style={compactStyles.input}
              name="involved"
              value={form.involved}
              onChange={handleChange}
              required
            >
              <option value="">Select</option>
              {peopleOptions.map((person) => (
                <option key={person._id} value={person.name}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>
          <div style={compactStyles.col}>
            <label style={compactStyles.label}>Add Person</label>
            <div style={{ display: "flex", gap: 4 }}>
              <input
                style={{ ...compactStyles.input, flex: 1 }}
                type="text"
                value={newPerson}
                onChange={(e) => setNewPerson(e.target.value)}
                placeholder="New person"
              />
              <button
                type="button"
                style={{ ...compactStyles.input, width: 40, padding: "2px 0" }}
                onClick={handleAddPerson}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div style={compactStyles.row}>
          <div style={compactStyles.col}>
            <label style={compactStyles.label}>Start Time</label>
            <input
              style={compactStyles.input}
              type="time"
              name="startTime"
              value={form.startTime}
              onChange={handleChange}
            />
          </div>
        </div>

        <div style={compactStyles.row}>
          <div style={compactStyles.col}>
            <label style={compactStyles.label}>End Time</label>
            <input
              style={compactStyles.input}
              type="time"
              name="endTime"
              value={form.endTime}
              onChange={handleChange}
            />
          </div>
          <div style={compactStyles.col}>
            <label style={compactStyles.label}>Start Date</label>
            <input
              style={compactStyles.input}
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <div style={compactStyles.row}>
          <div style={compactStyles.col}>
            <label style={compactStyles.label}>End Date</label>
            <input
              style={compactStyles.input}
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {form.type === "Project" && (
          <div>
            <label style={compactStyles.label}>Project</label>
            <select
              style={compactStyles.input}
              name="project"
              value={form.project}
              onChange={handleChange}
              required
            >
              <option value="">Select Project</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label style={compactStyles.label}>Tags</label>
          <div style={{ display: "flex", gap: 4 }}>
            <input
              style={{ ...compactStyles.input, flex: 1 }}
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add tag"
              onKeyDown={(e) => e.key === "Enter" && handleTagAdd(e)}
            />
            <button
              type="button"
              style={{ ...compactStyles.input, width: 40, padding: "2px 0" }}
              onClick={handleTagAdd}
            >
              Add
            </button>
          </div>
          <div>
            {form.tags.map((tag, idx) => (
              <span key={tag + '-' + idx} style={compactStyles.tag}>
                {tag}
                <span
                  style={compactStyles.tagRemove}
                  onClick={() => handleTagRemove(tag)}
                >
                  ×
                </span>
              </span>
            ))}
          </div>
        </div>

        <select
          style={compactStyles.input}
          name="status"
          value={form.status}
          onChange={handleChange}
        >
          <option>Not Started</option>
          <option>In Progress</option>
          <option>Completed</option>
        </select>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 13 }}>
            <input
              type="checkbox"
              name="recurring"
              checked={form.recurring}
              onChange={handleChange}
              style={{ marginRight: 4 }}
            />
            Recurring
          </label>
          <label style={{ fontSize: 13 }}>
            <input
              type="checkbox"
              name="reminder"
              checked={form.reminder}
              onChange={handleChange}
              style={{ marginRight: 4 }}
            />
            Reminder
          </label>
        </div>

        <div style={compactStyles.actions}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#970505ff",
              padding: "4px 14px",
              borderRadius: 4,
              border: "none"
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              background: "#0b7503ff",
              color: "#e7e7e7ff",
              padding: "4px 14px",
              borderRadius: 4,
              border: "none"
            }}
          >
            {task ? "Save" : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTaskForm;
