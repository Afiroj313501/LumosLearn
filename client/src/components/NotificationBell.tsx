import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyNotifications, markAllRead } from '../api/notifications';
import type { Notification } from '../api/notifications';
import './NotificationBell.css';

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const res = await getMyNotifications();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000); // poll every 60s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = async () => {
    if (!open && unreadCount > 0) {
      try {
        await markAllRead();
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      } catch (err) {
        console.error(err);
      }
    }
    setOpen(!open);
  };

  const handleClickNotification = (n: Notification) => {
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="notif-bell-wrap" ref={ref}>
      <button className="notif-bell-btn" onClick={handleToggle} aria-label="Notifications">
        🔔
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">Notifications</div>
          {notifications.length === 0 ? (
            <p className="notif-empty">No notifications yet.</p>
          ) : (
            <div className="notif-list">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={n.read ? 'notif-item' : 'notif-item unread'}
                  onClick={() => handleClickNotification(n)}
                >
                  <span className="notif-message">{n.message}</span>
                  <span className="notif-date">{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;