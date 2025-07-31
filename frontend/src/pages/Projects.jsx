import React, { useState, useEffect } from 'react';
import { Plus, Users, Calendar, Target, MoreVertical, Edit, Trash2, Eye, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn, buttonVariants } from '../utils/styles';

const API_URL = 'http://localhost:5000';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [dynamicUsers, setDynamicUsers] = useState([]);
  const [people, setPeople] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    priority: 'medium',
    start_date: '',
    end_date: '',
    assigned_users: [],
    assigned_users_input: '',
  });

  const userEmail = sessionStorage.getItem('email');
  const userName = sessionStorage.getItem('name');

  useEffect(() => {
    loadProjects();
    loadPeople();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch(`${API_URL}/api/projects`);
      if (!response.ok) throw new Error('Failed to load projects');
      const data = await response.json();
      const allUsers = new Set();
      (data.projects || []).forEach(p => (p.assigned_users || []).forEach(u => allUsers.add(u.trim())));
      setProjects((data.projects || []).filter(project => !project.in_trash));
      setDynamicUsers(Array.from(allUsers));
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPeople = async () => {
    try {
      const response = await fetch(`${API_URL}/api/people`);
      if (!response.ok) throw new Error('Failed to load people');
      const data = await response.json();
      setPeople(data.people.map(person => person.name) || []);
    } catch (error) {
      console.error('Error loading people:', error);
      toast.error('Failed to load people');
    }
  };

  const savePerson = async (name) => {
    try {
      const response = await fetch(`${API_URL}/api/people`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save person');
      }
      await loadPeople(); // Refresh people list after saving
      return true;
    } catch (error) {
      console.error('Error saving person:', error);
      toast.error(error.message);
      return false;
    }
  };

  const handleCreateProject = async (e) => {
    if (!formData.name.trim()) {
      toast.error('Project name is required');
      return;
    }
    e.preventDefault();
    try {
      // Save new users to people dataset
      const newUsers = formData.assigned_users.filter(user => !people.includes(user.trim()));
      for (const user of newUsers) {
        await savePerson(user.trim());
      }

      const response = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          created_by: userEmail,
          created_by_name: userName,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          assigned_users: formData.assigned_users.filter(user => user.trim()).map(user => user.trim()),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create project');
      }

      await loadProjects();
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        status: 'active',
        priority: 'medium',
        start_date: '',
        end_date: '',
        assigned_users: [],
        assigned_users_input: '',
      });
      toast.success('Project created successfully!');
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error(error.message);
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      // Save new users to people dataset
      const newUsers = formData.assigned_users.filter(user => !people.includes(user.trim()));
      for (const user of newUsers) {
        await savePerson(user.trim());
      }

      const response = await fetch(`${API_URL}/api/projects/${selectedProject._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          created_by: userEmail,
          created_by_name: userName,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          assigned_users: formData.assigned_users.filter(user => user.trim()).map(user => user.trim()),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update project');
      }

      await loadProjects();
      setShowEditModal(false);
      setSelectedProject(null);
      toast.success('Project updated successfully!');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error(error.message);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete project');
      }

      await loadProjects();
      toast.success('Project deleted successfully!');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error(error.message);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'on-hold':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleRemoveUser = (userToRemove) => {
    setFormData(prev => ({
      ...prev,
      assigned_users: prev.assigned_users.filter(user => user !== userToRemove),
    }));
  };

  const handleAddNewUser = async (e) => {
    e.preventDefault();
    const value = formData.assigned_users_input?.trim();
    if (value && !formData.assigned_users.includes(value)) {
      const success = await savePerson(value);
      if (success) {
        setFormData(prev => ({
          ...prev,
          assigned_users: [...prev.assigned_users, value],
          assigned_users_input: '',
        }));
      }
    }
  };

  const handleToggleUser = (user) => {
    setFormData(prev => ({
      ...prev,
      assigned_users: prev.assigned_users.includes(user)
        ? prev.assigned_users.filter(u => u !== user)
        : [...prev.assigned_users, user],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className={cn(buttonVariants.primary, 'flex items-center gap-2')}
        >
          <Plus size={16} />
          Create Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const assignedUsers = project.assigned_users || [];

          return (
            <div
              key={project._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 min-h-[40px]">{project.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(project.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                </div>

                {assignedUsers.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Assigned To</h4>
                    <div className="flex items-center -space-x-2">
                      {assignedUsers.slice(0, 4).map((user, index) => (
                        <div
                          key={typeof user === 'string' ? user : user._id || index}
                          title={typeof user === 'string' ? user : (user.name || user.email)}
                          className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center ring-2 ring-white"
                        >
                          <span className="text-xs font-bold text-gray-600">
                            {(typeof user === 'string' ? user : (user.name || user.email || '')).slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      ))}
                      {assignedUsers.length > 4 && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center ring-2 ring-white">
                          <span className="text-xs font-bold text-gray-600">+{assignedUsers.length - 4}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users size={14} />
                  <span>{project.created_by_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedProject(project);
                      setFormData({
                        name: project.name,
                        description: project.description,
                        status: project.status,
                        priority: project.priority,
                        start_date: project.start_date || '',
                        end_date: project.end_date || '',
                        assigned_users: project.assigned_users || [],
                        assigned_users_input: '',
                      });
                      setShowEditModal(true);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project._id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => setSelectedProject(project)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-500 mb-4">Create your first project to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className={cn(buttonVariants.primary)}
          >
            Create Project
          </button>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Users</label>
                <div className="w-full border border-gray-300 rounded-md px-3 py-2 max-h-40 overflow-y-auto">
                  {people.map((person, index) => (
                    <label key={index} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={formData.assigned_users.includes(person)}
                        onChange={() => handleToggleUser(person)}
                        className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{person}</span>
                    </label>
                  ))}
                  {people.length === 0 && (
                    <p className="text-sm text-gray-500">No users available</p>
                  )}
                </div>
                <div className="mt-2">
                  <input
                    type="text"
                    value={formData.assigned_users_input || ''}
                    onChange={(e) => setFormData({ ...formData, assigned_users_input: e.target.value })}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        await handleAddNewUser(e);
                      }
                    }}
                    list="people-suggestions"
                    placeholder="Type new name and press Enter"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="people-suggestions">
                    {people.map((person, index) => (
                      <option key={index} value={person} />
                    ))}
                  </datalist>
                </div>
                {formData.assigned_users.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.assigned_users.map((user, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2"
                      >
                        {user}
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(user)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className={cn(buttonVariants.primary, 'flex-1')}
                >
                  Create Project
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={cn(buttonVariants.secondary, 'flex-1')}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Project</h2>
            <form onSubmit={handleUpdateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Users</label>
                <div className="w-full border border-gray-300 rounded-md px-3 py-2 max-h-40 overflow-y-auto">
                  {people.map((person, index) => (
                    <label key={index} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={formData.assigned_users.includes(person)}
                        onChange={() => handleToggleUser(person)}
                        className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{person}</span>
                    </label>
                  ))}
                  {people.length === 0 && (
                    <p className="text-sm text-gray-500">No users available</p>
                  )}
                </div>
                <div className="mt-2">
                  <input
                    type="text"
                    value={formData.assigned_users_input || ''}
                    onChange={(e) => setFormData({ ...formData, assigned_users_input: e.target.value })}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        await handleAddNewUser(e);
                      }
                    }}
                    list="people-suggestions"
                    placeholder="Type new name and press Enter"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="people-suggestions">
                    {people.map((person, index) => (
                      <option key={index} value={person} />
                    ))}
                  </datalist>
                </div>
                {formData.assigned_users.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.assigned_users.map((user, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2"
                      >
                        {user}
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(user)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className={cn(buttonVariants.primary, 'flex-1')}
                >
                  Update Project
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className={cn(buttonVariants.secondary, 'flex-1')}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}