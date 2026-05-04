import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useUIStore from '../store/uiStore';

export const useKeyboardShortcuts = () => {
  const { toggleCommandPalette, openTaskModal, commandPaletteOpen, taskModalOpen } = useUIStore();
  const navigate = useNavigate();
  const pendingKey = useRef(null);
  const pendingTimer = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      const isInputActive = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      if (commandPaletteOpen || taskModalOpen || isInputActive) return;

      // Chord shortcuts: G → D (Dashboard), G → T (My Tasks)
      if (pendingKey.current === 'g') {
        clearTimeout(pendingTimer.current);
        pendingKey.current = null;
        if (e.key === 'd' || e.key === 'D') { e.preventDefault(); navigate('/dashboard'); return; }
        if (e.key === 't' || e.key === 'T') { e.preventDefault(); navigate('/tasks'); return; }
      }

      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        pendingKey.current = 'g';
        pendingTimer.current = setTimeout(() => { pendingKey.current = null; }, 500);
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openTaskModal();
      }
    };

    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      clearTimeout(pendingTimer.current);
    };
  }, [commandPaletteOpen, taskModalOpen, navigate]);
};

export const useEscapeKey = (handler, active = true) => {
  useEffect(() => {
    if (!active) return;
    const listener = (e) => { if (e.key === 'Escape') handler(); };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [handler, active]);
};

export const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler(e);
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
};
