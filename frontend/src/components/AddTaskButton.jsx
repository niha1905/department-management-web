import React from "react";
import { FaPlus } from "react-icons/fa";

export default function AddTaskButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 z-50 bg-gradient-to-br from-purple-500 to-pink-400 text-white p-5 rounded-full shadow-2xl hover:scale-110 hover:shadow-pink-400/50 transition-all duration-300 ease-in-out"
      title="Add Task"
    >
      <FaPlus className="text-2xl" />
    </button>
  );
}
