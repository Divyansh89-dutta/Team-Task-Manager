import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Palette, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Avatar from '../components/UI/Avatar';
import useAuthStore from '../store/authStore';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';
import { cn } from '../utils/helpers';

const TABS = [
  { id: 'profile', icon: User, label: 'Profile' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'appearance', icon: Palette, label: 'Appearance' },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({ name: user?.name || '', avatar: user?.avatar || '' });
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState(user?.preferences || {});

  useEffect(() => {
    setProfile({ name: user?.name || '', avatar: user?.avatar || '' });
    setPrefs(user?.preferences || {});
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await authApi.updateMe({ name: profile.name, avatar: profile.avatar || null });
      updateUser(data.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const applyTheme = (theme) => {
    const resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(resolved);
    localStorage.setItem('theme', theme);
  };

  const handleThemeChange = (theme) => {
    setPrefs((p) => ({ ...p, theme }));
    applyTheme(theme);
  };

  const handleSavePrefs = async () => {
    setSaving(true);
    try {
      const { data } = await authApi.updateMe({ preferences: prefs });
      updateUser(data.data.user);
      toast.success('Preferences saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Navbar title="Settings" />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6">
          <div className="flex gap-6">
            {/* Sidebar tabs */}
            <nav className="flex flex-col gap-1 w-40 flex-shrink-0">
              {TABS.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                    activeTab === id
                      ? 'bg-accent/15 text-accent font-medium'
                      : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                  )}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
              <div className="border-t border-border mt-2 pt-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </nav>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-base font-semibold text-text-primary mb-1">Profile</h2>
                      <p className="text-xs text-text-tertiary">Manage your personal information</p>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-surface border border-border rounded-xl">
                      <Avatar user={{ ...user, name: profile.name }} size="xl" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">{profile.name}</p>
                        <p className="text-xs text-text-tertiary">{user?.email}</p>
                        <span className="inline-flex items-center mt-1 text-2xs px-1.5 py-0.5 bg-accent/15 text-accent rounded">
                          {user?.role}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Input
                        label="Full name"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      />
                      <Input
                        label="Email"
                        value={user?.email}
                        disabled
                        hint="Email cannot be changed"
                      />
                      <Input
                        label="Avatar URL"
                        value={profile.avatar}
                        onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
                        placeholder="https://example.com/avatar.jpg"
                      />
                    </div>

                    <Button variant="primary" size="md" loading={saving} onClick={handleSaveProfile}>
                      Save changes
                    </Button>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-base font-semibold text-text-primary mb-1">Notifications</h2>
                      <p className="text-xs text-text-tertiary">Control how you receive updates</p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { key: 'notifications', label: 'Push notifications', desc: 'Receive real-time notifications' },
                        { key: 'emailDigest', label: 'Email digest', desc: 'Daily summary of activity' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between p-3.5 bg-surface border border-border rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-text-primary">{label}</p>
                            <p className="text-xs text-text-tertiary mt-0.5">{desc}</p>
                          </div>
                          <button
                            onClick={() => setPrefs({ ...prefs, [key]: !prefs[key] })}
                            className={cn(
                              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                              prefs[key] ? 'bg-accent' : 'bg-border'
                            )}
                          >
                            <span className={cn(
                              'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                              prefs[key] ? 'translate-x-4.5' : 'translate-x-0.5'
                            )} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <Button variant="primary" size="md" loading={saving} onClick={handleSavePrefs}>Save preferences</Button>
                  </div>
                )}

                {activeTab === 'appearance' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-base font-semibold text-text-primary mb-1">Appearance</h2>
                      <p className="text-xs text-text-tertiary">Customize your visual experience</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-secondary block mb-2">Theme</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'dark', label: 'Dark', preview: '#111111' },
                          { value: 'light', label: 'Light', preview: '#FFFFFF' },
                          { value: 'system', label: 'System', preview: 'linear-gradient(135deg, #111 50%, #FFF 50%)' },
                        ].map(({ value, label, preview }) => (
                          <button
                            key={value}
                            onClick={() => handleThemeChange(value)}
                            className={cn(
                              'flex flex-col items-center gap-2 p-3 rounded-lg border transition-all',
                              prefs.theme === value
                                ? 'border-accent bg-accent/10'
                                : 'border-border bg-surface hover:border-border-strong'
                            )}
                          >
                            <div
                              className="w-10 h-6 rounded-md border border-border"
                              style={{ background: preview }}
                            />
                            <span className="text-xs font-medium text-text-secondary">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <Button variant="primary" size="md" loading={saving} onClick={handleSavePrefs}>Save appearance</Button>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
