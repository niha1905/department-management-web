// Utility function to conditionally join class names
export const cn = (...classes) => classes.filter(Boolean).join(' ');

// Button variant styles
export const buttonVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  success: 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm hover:shadow',
  link: 'text-blue-600 hover:underline',
};

// Color mapping for tags and UI elements
export const colorMap = {
  'blue': 'bg-blue-100 text-blue-800',
  'green': 'bg-green-100 text-green-800',
  'purple': 'bg-purple-100 text-purple-800',
  'amber': 'bg-amber-100 text-amber-800',
  'red': 'bg-red-100 text-red-800',
  'teal': 'bg-teal-100 text-teal-800',
  'indigo': 'bg-indigo-100 text-indigo-800',
  'cyan': 'bg-cyan-100 text-cyan-800',
  'pink': 'bg-pink-100 text-pink-800',
  'lime': 'bg-lime-100 text-lime-800',
};

// Form input styles
export const inputStyles = 'w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200';

// Textarea styles
export const textareaStyles = 'w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none';

// Select styles
export const selectStyles = 'w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white';

// Card style variants
export const cardVariants = {
  default: 'bg-white rounded-xl shadow-sm border border-gray-100',
  hover: 'transition-all duration-200 hover:shadow-md',
  active: 'border-blue-200 ring-2 ring-blue-100',
};