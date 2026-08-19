import React, { useState } from "react";
import { Search, Bell, HelpCircle, X, Check, MessageSquare } from "lucide-react";

const timeAgo = (timestamp) => {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
};

const badgeStyle = {
  position: "absolute",
  top: -4,
  right: -4,
  background: "#ef4444",
  color: "#fff",
  borderRadius: "50%",
  minWidth: 18,
  height: 18,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 11,
  fontWeight: 600,
  lineHeight: 1,
  padding: "0 4px",
  pointerEvents: "none",
};

const panelStyle = {
  position: "absolute",
  top: "100%",
  right: 0,
  marginTop: 8,
  width: 360,
  background: "#fff",
  borderRadius: 10,
  boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
  border: "1px solid #e5e7eb",
  zIndex: 1000,
  overflow: "hidden",
};

const panelHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 16px",
  borderBottom: "1px solid #e5e7eb",
  fontWeight: 600,
  fontSize: 14,
  color: "#111827",
};

const panelBodyStyle = {
  maxHeight: 400,
  overflowY: "auto",
};

const emptyStyle = {
  padding: "40px 16px",
  textAlign: "center",
  color: "#9ca3af",
  fontSize: 14,
};

const itemStyle = (isRead) => ({
  display: "flex",
  flexDirection: "column",
  gap: 2,
  padding: "12px 16px",
  borderBottom: "1px solid #f3f4f6",
  cursor: "pointer",
  transition: "background 0.15s",
  borderLeft: isRead ? "3px solid transparent" : "3px solid #3b82f6",
  background: isRead ? "transparent" : "#eff6ff",
});

const markAllReadBtnStyle = {
  background: "none",
  border: "none",
  color: "#3b82f6",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 500,
  padding: 0,
};

export default function TopHeader({
  onSearch,
  notifications = [],
  unreadCount = 0,
  onNotificationClick,
  onMarkAllRead,
}) {
  const [showPanel, setShowPanel] = useState(false);

  const toggleNotificationPanel = () => setShowPanel((prev) => !prev);

  const handleSearch = (e) => {
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <header className="top-header-bar">
      <div className="search-archive-wrapper">
        <Search className="search-icon" />
        <input
          type="text"
          placeholder="Search archives..."
          className="search-archive-input"
          onChange={handleSearch}
        />
      </div>

      <div style={{ position: "relative" }}>
        <button className="header-action-btn" onClick={toggleNotificationPanel}>
          <Bell size={20} />
          {unreadCount > 0 && <span style={badgeStyle}>{unreadCount}</span>}
        </button>

        {showPanel && (
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>
              <span>Notifications</span>
              {unreadCount > 0 && (
                <button style={markAllReadBtnStyle} onClick={onMarkAllRead}>
                  Mark all read
                </button>
              )}
            </div>
            <div style={panelBodyStyle}>
              {notifications.length === 0 ? (
                <div style={emptyStyle}>No notifications</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    style={itemStyle(n.is_read)}
                    onClick={() => onNotificationClick && onNotificationClick(n)}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: n.is_read ? 400 : 600,
                        color: "#111827",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {n.is_read ? (
                        <Check size={14} color="#9ca3af" />
                      ) : (
                        <MessageSquare size={14} color="#3b82f6" />
                      )}
                      {n.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                        lineHeight: 1.4,
                      }}
                    >
                      {n.message}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#9ca3af",
                        marginTop: 2,
                      }}
                    >
                      {timeAgo(n.created_at)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <button className="header-action-btn" title="Help">
        <HelpCircle size={20} />
      </button>
    </header>
  );
}
