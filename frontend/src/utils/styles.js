// Utility function to conditionally join class names
export const cn = (...classes) => classes.filter(Boolean).join(' ');

// Button variant styles
export const buttonVariants = {
  primary: 'bg-[var(--gm-yellow)] hover:bg-[#D5E536] text-[#1a1a1a] shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 rounded-2xl',
  secondary: 'bg-[var(--gm-aqua)] hover:bg-[#5FFFF3] text-[#05343a] shadow-sm hover:shadow transform hover:scale-[1.02] transition-all duration-200 rounded-2xl',
  success: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 rounded-2xl',
  danger: 'bg-rose-500 hover:bg-rose-600 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 rounded-2xl',
  warning: 'bg-amber-400 hover:bg-amber-500 text-black shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 rounded-2xl',
  link: 'text-[var(--gm-aqua)] hover:text-[#5FFFF3] hover:underline transition-colors duration-200',
};

// Enhanced color mapping for tags and UI elements with gradients
export const colorMap = {
  'blue': 'bg-blue-50 text-blue-800 shadow-sm',
  'green': 'bg-emerald-50 text-emerald-800 shadow-sm',
  'purple': 'bg-purple-50 text-purple-800 shadow-sm',
  'amber': 'bg-amber-50 text-amber-800 shadow-sm',
  'red': 'bg-rose-50 text-rose-800 shadow-sm',
  'teal': 'bg-teal-50 text-teal-800 shadow-sm',
  'indigo': 'bg-indigo-50 text-indigo-800 shadow-sm',
  'cyan': 'bg-cyan-50 text-cyan-800 shadow-sm',
  'pink': 'bg-pink-50 text-pink-800 shadow-sm',
  'lime': 'bg-lime-50 text-lime-800 shadow-sm',
};

// Form input styles
export const inputStyles = 'w-full px-3 py-2 border border-[var(--color-border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--gm-aqua)]/40 focus:border-[var(--gm-aqua)] transition-all duration-200 bg-[var(--gm-white)]';

// Textarea styles
export const textareaStyles = 'w-full px-3 py-2 border border-[var(--color-border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--gm-aqua)]/40 focus:border-[var(--gm-aqua)] transition-all duration-200 resize-none bg-[var(--gm-white)]';

// Select styles
export const selectStyles = 'w-full px-3 py-2 border border-[var(--color-border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--gm-aqua)]/40 focus:border-[var(--gm-aqua)] transition-all duration-200 bg-[var(--gm-white)]';

// Enhanced card style variants with gradients and effects
export const cardVariants = {
  default: 'bg-[var(--gm-white)] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[var(--color-border)]',
  hover: 'transition-all duration-300 hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] hover:transform hover:scale-[1.02]',
  active: 'border-[var(--gm-aqua)]/40 ring-2 ring-[var(--gm-aqua)]/20 shadow-lg shadow-[rgba(63,255,224,0.2)]',
};