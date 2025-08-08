import React, { useState, useEffect, useCallback } from "react";
import moment from "moment";
import classNames from "classnames";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { X, Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import MonthTable from '../components/MonthTable';
import WeeklyView from '../components/WeeklyView';
import TaskPanel from '../components/TaskPanel';
import AddTaskForm from '../components/AddTaskForm';
import YearlyCalendar from '../components/YearlyCalendar';
import { createNote, updateNote, deleteNote } from '../services/api';
import PageHeader from '../components/PageHeader';

const getWeekDates = (date) => {
  const start = moment(date).startOf("week");
  return Array.from({ length: 7 }, (_, i) => moment(start).add(i, "days"));
};

// Modal for calendar day events
function CalendarEventModal({ open, date, tasks, onClose }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, pointerEvents: 'auto' }}>
      <div style={{ background: 'white', borderRadius: 8, padding: '18px 28px', minWidth: 320, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #e5e7eb' }}>
        <h3 style={{ margin: 0, fontWeight: 600, fontSize: 17, color: '#4f46e5' }}>Routine Tasks for {date}</h3>
        <div style={{ margin: '12px 0', fontSize: 15, textAlign: 'center', minWidth: 220 }}>
          {tasks && tasks.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {tasks.map((task, idx) => (
                <li key={task.id || idx} style={{ marginBottom: 6, color: '#333333', fontWeight: 500 }}>
                  {task.title}
                  {task.deadline && (
                    <span style={{ color: '#666666', fontWeight: 400, fontSize: 13, marginLeft: 8 }}>
                      ({new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <span style={{ color: '#666666' }}>No routine tasks for this day.</span>
          )}
        </div>
        <button onClick={onClose} style={{ background: '#4f46e5', color: 'white', border: 'none', borderRadius: 4, padding: '7px 20px', fontWeight: 500, cursor: 'pointer', marginTop: 6 }}>OK</button>
      </div>
    </div>
  );
}

const RoutineTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(moment());
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [showYearly, setShowYearly] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState({});
  const [view, setView] = useState('week'); // 'day', 'week', 'month', 'year'
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [calendarModalDate, setCalendarModalDate] = useState("");
  const [calendarModalTasks, setCalendarModalTasks] = useState([]);

  // Load tasks from backend on mount
  useEffect(() => {
    const fetchRoutineTasks = async () => {
      try {
        // Fetch all notes of type 'routine task' from backend
        const res = await fetch('/api/notes?filter_type=routine task');
        if (!res.ok) throw new Error('Failed to fetch routine tasks');
        const data = await res.json();
        setTasks(data.notes || []);
      } catch (err) {
        console.error('Failed to load routine tasks from DB:', err);
        setTasks([]);
      }
    };
    fetchRoutineTasks();
  }, []);

  // Remove localStorage sync
  // useEffect(() => {
  //   localStorage.setItem("routine_tasks", JSON.stringify(tasks));
  // }, [tasks]);

  const weekDates = getWeekDates(selectedDate);

  // Group tasks by deadline date (YYYY-MM-DD)
  const tasksByDate = tasks.reduce((acc, t) => {
    if (!t.deadline) return acc;
    const dateStr = moment(t.deadline).format("YYYY-MM-DD");
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(t);
    return acc;
  }, {});

  // Add or update a routine task in the DB
  const handleAddTask = async (task) => {
    try {
      let savedTask;
      // Ensure deadline is ISO string
      let deadline = task.deadline || task.endDate || null;
      if (deadline && typeof deadline === 'string' && deadline.length <= 16) {
        deadline = new Date(deadline).toISOString();
      }
      if (task._id) {
        // Update routine task in DB
        const updated = await updateNote(task._id, {
          title: task.title,
          description: task.description,
          color: task.color || 'blue',
          tags: task.tags || [],
          deadline,
          type: 'routine task',
          completed: task.completed || false,
        });
        savedTask = updated;
        setTasks(prev => prev.map(t => t._id === task._id ? savedTask : t));
        toast.success('Task updated!');
        return;
      } else {
        // Create new routine task in DB
        const response = await createNote({
          title: task.title,
          description: task.description,
          color: task.color || 'blue',
          tags: task.tags || [],
          deadline,
          type: 'routine task',
          completed: false,
        });
        savedTask = response.note || response;
        setTasks(prev => [...prev, savedTask]);
        toast.success('Task saved!');
      }
    } catch (err) {
      toast.error('Failed to save routine task to DB');
      console.error(err);
    }
  };

  const handleEditTask = async (updatedTask) => {
    try {
      // Ensure the completed field is properly set based on status
      if (updatedTask.status === "Completed" && !updatedTask.completed) {
        updatedTask.completed = true;
      } else if (updatedTask.status === "Ongoing" && updatedTask.completed) {
        updatedTask.completed = false;
      }

      // Make sure we're sending at least the required fields
      const updateData = {
        title: updatedTask.title,
        description: updatedTask.description || '',
        completed: updatedTask.completed
      };

      // Add other fields if they exist
      if (updatedTask.status) updateData.status = updatedTask.status;
      if (updatedTask.type) updateData.type = updatedTask.type;
      if (updatedTask.priority) updateData.priority = updatedTask.priority;
      if (updatedTask.tags) updateData.tags = updatedTask.tags;
      if (updatedTask.deadline) updateData.deadline = updatedTask.deadline;

      const updated = await updateNote(updatedTask._id, updateData);
      setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
      setActiveTask(updatedTask);
      toast.success("Task updated successfully!");
    } catch (err) {
      toast.error("Failed to update task");
      console.error(err);
    }
  };

  // Delete a routine task from the DB
  const handleDeleteTask = async (id) => {
    try {
      await deleteNote(id);
      setTasks(prev => prev.filter(t => t._id !== id));
      setShowTaskPanel(false);
      toast.info('Task deleted.');
    } catch (err) {
      toast.error('Failed to delete routine task from DB');
      console.error(err);
    }
  };

  const handleTaskClick = (task) => {
    setActiveTask(task);
    setShowTaskPanel(true);
  };

  // Toggle task completion status
  const handleTaskComplete = async (task) => {
    try {
      const updatedTask = { ...task, completed: !task.completed };
      const updated = await updateNote(task._id, {
        title: task.title,
        description: task.description || '',
        completed: !task.completed
      });
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, completed: !t.completed } : t));
      toast.success(updatedTask.completed ? 'Task marked as completed!' : 'Task marked as incomplete!');
    } catch (err) {
      toast.error('Failed to update task status');
      console.error(err);
    }
  };

  const handleWeekNav = (dir) => {
    setSelectedDate(moment(selectedDate).add(dir, "week"));
  };

  const handleMonthNav = (dir) => {
    setSelectedDate(moment(selectedDate).add(dir, "month"));
  };

  const handleMiniDateClick = (dateStr) => {
    setSelectedDate(moment(dateStr));
    // Find all tasks for this date by deadline
    const dayTasks = tasks.filter(t =>
      t.deadline && moment(t.deadline).format("YYYY-MM-DD") === dateStr
    );
    setCalendarModalDate(dateStr);
    setCalendarModalTasks(dayTasks);
    setCalendarModalOpen(true);
  };

  const handleYearlyToggle = () => setShowYearly(x => !x);

  const filteredTasks = search
    ? tasks.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.tags && t.tags.join(" ").toLowerCase().includes(search.toLowerCase()))
      )
    : tasks;

  return (
    <div className="w-full">
      <PageHeader title="Routine Tasks" subtitle="Plan your recurring work" />
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-pink-50 to-purple-100 flex">
        {/* Sidebar */}
        <aside className="w-72 p-4 border-r bg-white/80 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-lg text-gray-700">This Month</h2>
            <button
              onClick={handleYearlyToggle}
              aria-label="Open yearly planner"
              className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-lg px-2 py-1 border border-purple-200 hover:from-purple-200 hover:to-pink-200 transition"
            >
              <CalendarIcon className="w-5 h-5" />
            </button>
          </div>
          <MonthTable
            year={selectedDate.year()}
            month={selectedDate.month()}
            tasksByDate={tasksByDate}
            onDayClick={handleMiniDateClick}
            onPrevMonth={() => handleMonthNav(-1)}
            onNextMonth={() => handleMonthNav(1)}
          />
          <div className="mt-6">
            <input
              className="w-full p-2 rounded-full border-2 border-transparent focus:border-gradient-to-r focus:from-purple-400 focus:to-pink-400 shadow focus:shadow-lg transition-all duration-300"
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search tasks"
            />
          </div>
        </aside>

        {/* Main Planner */}
        <main className="flex-1 flex flex-col h-full relative bg-gradient-to-br from-white via-blue-50 to-pink-50">
          <div className="flex items-center justify-between p-4 border-b bg-white/80">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleWeekNav(-1)}
                aria-label="Previous week"
                className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-lg px-2 py-1 border border-purple-200 hover:from-purple-200 hover:to-pink-200 transition"
              >
                <ChevronLeft />
              </button>
              <select
                value={view}
                onChange={e => setView(e.target.value)}
                className="rounded-full border px-3 py-1 text-sm bg-white text-gray-800 border-gray-300 focus:outline-none shadow"
                style={{ minWidth: 90 }}
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
              <button
                onClick={() => handleWeekNav(1)}
                aria-label="Next week"
                className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-lg px-2 py-1 border border-purple-200 hover:from-purple-200 hover:to-pink-200 transition"
              >
                <ChevronRight />
              </button>
            </div>
            <h2 className="font-medium text-lg text-gray-700">
              {view === 'week' && (
                `${weekDates[0].format("MMM D")} – ${weekDates[6].format("MMM D, YYYY")}`
              )}
              {view === 'day' && selectedDate.format("dddd, MMM D, YYYY")}
              {view === 'month' && selectedDate.format("MMMM YYYY")}
              {view === 'year' && selectedDate.format("YYYY")}
            </h2>
          </div>
          {/* Main View Switcher */}
          {view === 'week' && (
            <WeeklyView
              weekDates={weekDates}
              tasksByDate={tasksByDate}
              onDayClick={handleMiniDateClick}
              onTaskClick={handleTaskClick}
              onTaskComplete={handleTaskComplete}
            />
          )}
          {view === 'day' && (
            <WeeklyView
              weekDates={[selectedDate]}
              tasksByDate={tasksByDate}
              onDayClick={handleMiniDateClick}
              onTaskClick={handleTaskClick}
              onTaskComplete={handleTaskComplete}
            />
          )}
          {view === 'month' && (
            <MonthTable
              year={selectedDate.year()}
              month={selectedDate.month()}
              tasksByDate={tasksByDate}
              onDayClick={handleMiniDateClick}
              onPrevMonth={() => handleMonthNav(-1)}
              onNextMonth={() => handleMonthNav(1)}
            />
          )}
          {view === 'year' && (
            <YearlyCalendar
              year={selectedDate.year()}
              tasksByDate={tasksByDate}
              onMonthClick={dateStr => {
                setSelectedDate(moment(dateStr));
                setView('month');
              }}
            />
          )}
          {/* Floating Add Button */}
          <button
            className="fixed bottom-8 right-8 rounded-full p-4 shadow-lg bg-gradient-to-br from-purple-500 to-pink-400 text-white hover:scale-110 hover:shadow-pink-400/50 transition-all duration-300 ease-in-out"
            onClick={() => setShowAddForm(true)}
            aria-label="Add Task"
          >
            <Plus />
          </button>
        </main>

      {/* Modals */}
      {showAddForm && (
        <AddTaskForm
          date={selectedDate.format("YYYY-MM-DD")}
          onClose={() => setShowAddForm(false)}
          onAddTask={handleAddTask}
        />
      )}
      {showTaskPanel && activeTask && (
        <TaskPanel
          task={activeTask}
          onClose={() => setShowTaskPanel(false)}
          onEdit={handleEditTask}
          onEditStatus={handleEditTask}
          onDelete={() => handleDeleteTask(activeTask._id)}
        />
      )}
      {showYearly && (
        <YearlyCalendar
          year={selectedDate.year()}
          tasksByDate={tasksByDate}
          onMonthClick={dateStr => {
            setSelectedDate(moment(dateStr));
            setShowYearly(false);
          }}
        />
      )}
      {/* Calendar Event Modal */}
      <CalendarEventModal
        open={calendarModalOpen}
        date={calendarModalDate}
        tasks={calendarModalTasks}
        onClose={() => setCalendarModalOpen(false)}
      />
      <ToastContainer position="bottom-right" />
      </div>
    </div>
  );
};

export default RoutineTasks;