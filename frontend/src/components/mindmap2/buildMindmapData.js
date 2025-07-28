// Utility to build hierarchical mind map data for Projects and People views
// Usage: buildProjectsMindmap(projects, notes), buildPeopleMindmap(people, projects, notes)

export function buildProjectsMindmap(projects, notes) {
  return projects.map(project => ({
    id: `project-${project._id}`,
    title: project.name,
    description: project.description,
    icon: 'rocket',
    children: notes
      .filter(note => note.project_id === project._id || note.project === project._id)
      .map(task => ({
        id: `task-${task.id}`,
        title: task.title,
        description: task.content,
        icon: 'target',
        status: task.status || 'incomplete',
        comments: task.comments || [],
      }))
  }));
}

export function buildPeopleMindmap(people, projects, notes) {
  // Remove duplicate people
  const uniquePeople = Array.from(new Set(people));
  return uniquePeople.map(person => ({
    id: `person-${person}`,
    title: person,
    icon: 'users',
    children: projects
      .filter(project => (project.assigned_users || []).includes(person))
      .map(project => ({
        id: `project-${project._id}`,
        title: project.name,
        description: project.description,
        icon: 'rocket',
        children: notes
          .filter(note => note.project_id === project._id || note.project === project._id)
          .map(task => ({
            id: `task-${task.id}`,
            title: task.title,
            description: task.content,
            icon: 'target',
            status: task.status || 'incomplete',
            comments: task.comments || [],
          }))
      }))
  }));
}