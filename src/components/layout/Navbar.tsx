import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Monitor, Landmark, User } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../ui/Button';
import styles from './Navbar.module.css';

export const Navbar: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>
        <div className={styles.logo}>
          <motion.div
            initial={{ rotate: -10, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Landmark size={28} className={styles.logoIcon} strokeWidth={2.5} />
          </motion.div>
          <span>BANKDROP</span>
        </div>

        <div className={styles.navLinks}>
          <a href="#" className={styles.navLink}>Dashboard</a>
          <a href="#" className={styles.navLink}>Accounts</a>
          <a href="#" className={styles.navLink}>Payments</a>
          <a href="#" className={styles.navLink}>Settings</a>
        </div>

        <div className={styles.actions}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleTheme()}
            className={styles.themeToggle}
            title={`Theme: ${theme}`}
          >
            <AnimatePresence mode="wait">
              {theme === 'system' ? (
                <motion.div
                  key="system"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Monitor size={20} />
                </motion.div>
              ) : theme === 'dark' ? (
                <motion.div
                  key="dark"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon size={20} />
                </motion.div>
              ) : (
                <motion.div
                  key="light"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun size={20} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.hash = '#/profile'}
            className={styles.themeToggle}
            title="Profile"
          >
            <User size={20} />
          </motion.button>
          
          <Button variant="accent" size="small">Get Started</Button>
        </div>
      </div>
    </nav>
  );
};
