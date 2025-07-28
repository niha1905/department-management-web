import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn, buttonVariants, inputStyles, textareaStyles, selectStyles } from '../utils/styles';
import TagInput from './TagInput';

const API_URL = 'http://192.168.1.100:5000';

const NoteFormModal = ({
  isOpen,
  onClose,
  initialData = null,
  onSave,
  colorMap,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [],
    color: 'blue',
    deadline: '',
    type: 'daily task',
    project_id: null,
    assigned_to: [],
  });

  const [projects, setProjects] = useState([]);
  const [people, setPeople] = useState([]);

  const userEmail = sessionStorage.getItem('email') || '';
  const userName = sessionStorage.getItem('name') || '';

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        tags: initialData.tags || [],
        deadline: initialData.deadline
          ? new Date(initialData.deadline).toISOString().substring(0, 16)
          : '',
        assigned_to: initialData.assigned_to || [],
      });
    } else {
      setFormData({
        title: '',
        description: '',
        tags: [],
        color: 'blue',
        deadline: '',
        type: 'daily task',
        created_by: userEmail,
        created_by_name: userName,
        assigned_to: [],
      });
    }
  }, [initialData, isOpen, userName, userEmail]);

  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        try {
          const projectResponse = await fetch(`${API_URL}/api/projects`);
          if (!projectResponse.ok) throw new Error(`Failed to fetch projects: ${projectResponse.status}`);
          const projectData = await projectResponse.json();
          setProjects(projectData.projects || []);

          const peopleResponse = await fetch(`${API_URL}/api/people`);
          if (!peopleResponse.ok) throw new Error(`Failed to fetch people: ${peopleResponse.status}`);
          const peopleData = await peopleResponse.json();
          setPeople(peopleData.people || []);
        } catch (error) {
          // Silent fail
        }
      };
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.type === 'project' && formData.project_id) {
      const selectedProject = projects.find(project => project._id === formData.project_id);
      if (selectedProject && selectedProject.assigned_users) {
        setFormData(prev => ({
          ...prev,
          assigned_to: selectedProject.assigned_users || [],
        }));
      }
    }
  }, [formData.type, formData.project_id, projects]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const noteData = { ...formData };
    if (!noteData._id) {
      noteData.created_by = userEmail;
      noteData.created_by_name = userName;
    }
    onSave(noteData);
  };

  if (!isOpen) return null;

  const isEditing = Boolean(initialData?._id);
  const showProjectDropdown = formData.type === 'project';
  const showHandlers = formData.type === 'project';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 backdrop-blur-sm">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl max-w-sm w-full overflow-hidden"
        >
          <div className="flex justify-between items-center border-b border-gray-100 p-2">
            <h2 className="text-lg font-semibold text-gray-800">
              {isEditing ? 'Edit Note' : 'Create New Note'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-2">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs font-medium text-gray-700">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={inputStyles}
                  placeholder="Enter title"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs font-medium text-gray-700">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={textareaStyles}
                  rows="3"
                  placeholder="Enter description"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs font-medium text-gray-700">Tags</label>
                <TagInput
                  tags={formData.tags || []}
                  setTags={newTags => setFormData({ ...formData, tags: newTags })}
                  placeholder="Type and press Enter"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs font-medium text-gray-700">Color</label>
                <div className="flex gap-1">
                  {Object.entries(colorMap).map(([colorName, colorClass]) => (
                    <button
                      key={colorName}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: colorName })}
                      className={`w-5 h-5 rounded-full ${colorClass.split(' ')[0]}
                        ${formData.color === colorName ? 'ring-2 ring-offset-2 ring-gray-400' : ''}
                        hover:scale-110 transition-transform`}
                      title={colorName.charAt(0).toUpperCase() + colorName.slice(1)}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs font-medium text-gray-700">Deadline</label>
                <input
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className={inputStyles}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs font-medium text-gray-700">Type</label>
                <select
                  value={formData.type || 'daily task'}
                  onChange={e => setFormData({ ...formData, type: e.target.value, project_id: '', assigned_to: [] })}
                  className={selectStyles}
                >
                  <option value="daily task">Daily Work</option>
                  <option value="task">Task</option>
                  <option value="project">Project</option>
                </select>
              </div>

              {showProjectDropdown && (
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-xs font-medium text-gray-700">Project</label>
                  <select
                    value={formData.project_id || ''}
                    onChange={e => setFormData({ ...formData, project_id: e.target.value || null })}
                    className={selectStyles}
                  >
                    <option value="">No Project</option>
                    {projects.map(project => (
                      <option key={project._id} value={project._id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {showHandlers && (
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-xs font-medium text-gray-700">Handlers</label>
                  <select
                    multiple
                    value={formData.assigned_to}
                    onChange={e => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setFormData({ ...formData, assigned_to: selected });
                    }}
                    className={selectStyles}
                  >
                    {people.map(person => (
                      <option key={person.name} value={person.name}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isEditing && formData.created_by && (
                <div className="border-t border-gray-100 pt-1 mt-1">
                  <p className="text-xs text-gray-600">
                    Created by: <span className="font-medium">{formData.created_by_name}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="mt-2 flex justify-end gap-1">
              <button
                type="button"
                onClick={onClose}
                className={cn(buttonVariants.secondary, 'px-2 py-1 rounded-md text-xs')}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={cn(
                  buttonVariants.primary,
                  'px-3 py-1 rounded-md text-xs',
                  isSubmitting && 'opacity-70 cursor-not-allowed',
                )}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-1 h-2 w-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving...
                  </span>
                ) : isEditing ? 'Update Note' : 'Create Note'}
              </button>
            </div>
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default NoteFormModal;
