import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/helpers';

const Tooltip = ({ children, content, side = 'top', delay = 500, className }) => {
  const [visible, setVisible] = useState(false);
  let timer;

  const show = () => { timer = setTimeout(() => setVisible(true), delay); };
  const hide = () => { clearTimeout(timer); setVisible(false); };

  const positions = {
    top: '-top-8 left-1/2 -translate-x-1/2',
    bottom: '-bottom-8 left-1/2 -translate-x-1/2',
    left: 'top-1/2 -translate-y-1/2 -left-2 -translate-x-full',
    right: 'top-1/2 -translate-y-1/2 -right-2 translate-x-full',
  };

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className={cn(
              'absolute z-50 pointer-events-none whitespace-nowrap',
              'px-2 py-1 text-xs font-medium rounded-md',
              'bg-background-elevated border border-border text-text-primary shadow-elevation-2',
              positions[side],
              className
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;
