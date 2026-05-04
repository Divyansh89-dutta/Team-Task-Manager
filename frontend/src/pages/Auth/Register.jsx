import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap, ArrowRight, Check } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';

const PasswordStrength = ({ password }) => {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /\d/.test(password) },
  ];
  const strength = checks.filter((c) => c.pass).length;
  const colors = ['bg-red-500', 'bg-yellow-500', 'bg-accent'];

  if (!password) return null;
  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength ? colors[strength - 1] : 'bg-border'}`}
          />
        ))}
      </div>
      <div className="flex gap-3">
        {checks.map(({ label, pass }) => (
          <span key={label} className={`flex items-center gap-1 text-2xs ${pass ? 'text-green-400' : 'text-text-tertiary'}`}>
            <Check size={9} className={pass ? 'opacity-100' : 'opacity-0'} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.name || form.name.length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await register(form);
    if (result.success) navigate('/dashboard');
    else setErrors({ submit: result.message });
  };

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-text-primary">Linear</span>
        </div>

        <div className="mb-8">
          <h1 className="text-xl font-bold text-text-primary mb-1">Create your account</h1>
          <p className="text-sm text-text-secondary">Start managing tasks like a pro</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full name"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
            placeholder="Alex Johnson"
            autoFocus
          />

          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email}
            placeholder="name@company.com"
          />

          <div className="space-y-2">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
              placeholder="Min 8 characters"
              iconRight={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-text-tertiary hover:text-text-secondary">
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
            />
            <PasswordStrength password={form.password} />
          </div>

          {errors.submit && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2"
            >
              {errors.submit}
            </motion.p>
          )}

          <Button type="submit" variant="primary" className="w-full" loading={isLoading} iconRight={!isLoading && <ArrowRight size={14} />}>
            Create account
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-text-tertiary">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:text-accent-hover font-medium">Sign in</Link>
          </p>
        </div>

        <p className="mt-6 text-2xs text-text-tertiary text-center leading-relaxed">
          By creating an account, you agree to our{' '}
          <a href="#" className="text-accent">Terms</a> and{' '}
          <a href="#" className="text-accent">Privacy Policy</a>.
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
