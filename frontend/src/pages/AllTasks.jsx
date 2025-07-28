import React, { useEffect, useState } from "react";
import { fetchUsers, fetchNotes } from "../services/api";

// Simple modal for showing note details
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{
        background: "#fff", borderRadius: 12, padding: 24, minWidth: 320, maxWidth: 400, boxShadow: "0 4px 32px rgba(0,0,0,0.15)"
      }}>
        {children}
        <button onClick={onClose} style={{ marginTop: 16, float: "right" }}>Close</button>
      </div>
    </div>
  );
}

export default function AllTasks() {
  const [users, setUsers] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    fetchUsers().then(res => setUsers(res.users || []));
    fetchNotes().then(res => setNotes(res || []));
  }, []);

  const radius = 180;
  const center = 200;
  const userCount = users.length;

  // Filter notes for the selected user (by tags with @ prefix)
  const userNotes = selectedUser
    ? notes.filter(note => {
        if (note.tags && Array.isArray(note.tags)) {
          return note.tags.some(tag => 
            tag === `@${selectedUser.email}` || 
            tag === `@${selectedUser._id}` ||
            tag === `@${selectedUser.name}`
          );
        }
        return false;
      })
    : [];


  return (
    <div style={{ minHeight: "100vh", background: "#f6f8fa", paddingTop: "2rem" }}>
      <h1 style={{
        textAlign: "center",
        fontWeight: "bold",
        fontSize: "2rem",
        marginBottom: "2rem"
      }}>
        Connections
      </h1>

      {/* User Circle */}
      <div style={{
        position: "relative",
        width: `${center * 2}px`,
        height: `${center * 2}px`,
        margin: "0 auto",
        filter: selectedUser ? "blur(2px)" : "none",
        transition: "filter 0.2s"
      }}>
        {users.map((user, i) => {
          const angle = (2 * Math.PI * i) / userCount;
          const x = center + radius * Math.cos(angle) - 40;
          const y = center + radius * Math.sin(angle) - 40;
          const isAdmin = user.role === "admin";
          return (
            <button
              key={user._id || user.id || i}
              onClick={() => setSelectedUser(user)}
              style={{
                position: "absolute",
                left: `${x}px`,
                top: `${y}px`,
                width: "80px",
                height: "80px",
                borderRadius: "8px",
                background: isAdmin ? "linear-gradient(90deg, #6366f1, #a5b4fc)" : "#fff",
                color: isAdmin ? "#fff" : "#222",
                border: isAdmin ? "2px solid #6366f1" : "2px solid #e5e7eb",
                fontWeight: "bold",
                boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "1rem",
                transition: "box-shadow 0.2s, background 0.2s",
                textAlign: "center",
                padding: "0 5px",
                whiteSpace: "normal",
                lineHeight: "1.2",
              }}
              title={isAdmin ? "Admin" : "User"}
            >
              <div>
                {user.name || user.email}
                {isAdmin && (
                  <span style={{
                    display: "inline-block",
                    marginLeft: "0.4em",
                    fontSize: "0.75em",
                    background: "rgba(0,0,0,0.1)",
                    borderRadius: "1em",
                    padding: "0.1em 0.5em",
                    verticalAlign: "middle",
                    fontWeight: "normal"
                  }}>
                    Admin
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Half-screen Drawer for User's Tasks */}
      {selectedUser && (
        <div style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "50vw",
          height: "100vh",
          background: "#fff",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.08)",
          zIndex: 999,
          padding: "2rem 2rem 2rem 3rem",
          display: "flex",
          flexDirection: "column"
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>
              {selectedUser.name || selectedUser.email}
            </h2>
            <button
              style={{
                marginLeft: "auto",
                fontSize: "1.2rem",
                background: "none",
                border: "none",
                cursor: "pointer"
              }}
              onClick={() => {
                setSelectedUser(null);
                setSelectedNote(null);
              }}
            >
              ×
            </button>
          </div>
          <h3 style={{ fontWeight: "normal", marginBottom: 16 }}>Assigned Tasks</h3>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {userNotes.length === 0 ? (
              <div style={{ color: "#aaa" }}>No tasks assigned.</div>
            ) : (
              userNotes.map(note => (
                <div
                  key={note._id || note.id}
                  style={{
                    padding: "1rem",
                    marginBottom: 12,
                    background: "#f3f4f6",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                  onClick={() => setSelectedNote(note)}
                >
                  {note.title}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal for Task Details */}
      <Modal open={!!selectedNote} onClose={() => setSelectedNote(null)}>
        {selectedNote && (
          <div>
            <h3 style={{ margin: 0 }}>{selectedNote.title}</h3>
            <p style={{ marginTop: 12, color: "#444" }}>
              {selectedNote.content || selectedNote.description}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
