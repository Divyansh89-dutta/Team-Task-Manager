import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap, ArrowRight } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await login(form);
    if (result.success) navigate('/dashboard');
    else setErrors({ submit: result.message });
  };

  return (
    <div className="min-h-screen bg-background-primary flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-background-secondary border-r border-border p-12">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-base font-semibold text-text-primary tracking-tight">Linear</span>
        </div>

        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className="text-3xl font-bold text-text-primary leading-tight mb-4">
              Build and ship<br />
              <span className="text-accent">faster together.</span>
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
              The issue tracker that makes teams work better. Streamline, collaborate, and ship.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 grid grid-cols-2 gap-4"
          >
            {[
              { label: 'Tasks managed', value: '10K+' },
              { label: 'Teams using', value: '500+' },
              { label: 'Uptime', value: '99.9%' },
              { label: 'Avg response', value: '<50ms' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-surface rounded-xl p-3 border border-border">
                <p className="text-lg font-bold text-text-primary">{value}</p>
                <p className="text-2xs text-text-tertiary mt-0.5">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <p className="text-2xs text-text-tertiary">© 2024 Linear Team. All rights reserved.</p>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-text-primary">Linear</span>
          </div>

          <div className="mb-8">
            <h1 className="text-xl font-bold text-text-primary mb-1">Welcome back</h1>
            <p className="text-sm text-text-secondary">Sign in to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
              placeholder="name@company.com"
              autoComplete="email"
              autoFocus
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
              placeholder="••••••••"
              autoComplete="current-password"
              iconRight={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
            />

            {errors.submit && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2"
              >
                {errors.submit}
              </motion.p>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={isLoading}
              iconRight={!isLoading && <ArrowRight size={14} />}
            >
              Sign in
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-text-tertiary">
              Don't have an account?{' '}
              <Link to="/register" className="text-accent hover:text-accent-hover font-medium transition-colors">
                Create one
              </Link>
            </p>
          </div>

          {/* Demo hint */}
          <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-lg">
            <p className="text-2xs text-text-secondary text-center">
              Demo: <span className="font-mono text-accent">demo@linear.app</span> / <span className="font-mono text-accent">password123</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
