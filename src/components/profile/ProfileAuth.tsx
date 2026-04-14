import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomerProfile } from '../../context/CustomerProfileContext';
import { Input } from '../ui/Input';
import { OTPInput } from '../ui/OTPInput';
import { Button } from '../ui/Button';
import styles from './ProfileUI.module.css';
import { ChevronRight, ShieldCheck, Mail, Loader2, ArrowLeft } from 'lucide-react';

interface Props {
  onExit: () => void;
}


type AuthStep = 'email' | 'signup_reveal' | 'otp';

export const ProfileAuth: React.FC<Props> = () => {
  const { checkEmail, login, signup, isLoadingAuth } = useCustomerProfile();
  
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [prevEmail, setPrevEmail] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isNewUser, setIsNewUser] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);

  // Debounced Email Autocheck
  useEffect(() => {
    if (step !== 'email') return;
    
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmailValid) {
      setEmailChecked(false);
      return;
    }

    const timer = setTimeout(async () => {
      const { exists } = await checkEmail(email);
      setIsNewUser(!exists);
      setEmailChecked(true);
      setPrevEmail(email);
      
      // AUTO-ADVANCE
      if (autoAdvanceEnabled) {
        setStep(exists ? 'otp' : 'signup_reveal');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [email, step, checkEmail, autoAdvanceEnabled]);

  // Handle intent reset (Typo Recovery)
  useEffect(() => {
    // Only reset if change is significant (> 2 chars)
    if (Math.abs(email.length - prevEmail.length) > 2) {
      setAutoAdvanceEnabled(true);
      if (step !== 'email') {
        setStep('email');
        setEmailChecked(false);
      }
    }
  }, [email]); // Removed step from dependencies to fix the loop trap

  const handleMainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 'email') {
      if (!emailChecked) {
        const { exists } = await checkEmail(email);
        setIsNewUser(!exists);
        setEmailChecked(true);
        setStep(exists ? 'otp' : 'signup_reveal');
      } else {
        setStep(isNewUser ? 'signup_reveal' : 'otp');
      }
    } else if (step === 'signup_reveal') {
      setStep('otp');
    }
  };

  const handleVerify = async (code: string) => {
    if (isNewUser) {
      await signup({ email, name, mobile }, code);
    } else {
      await login(email, code);
    }
  };

  const getButtonLabel = () => {
    if (isLoadingAuth) return <Loader2 className="animate-spin" size={20} />;
    if (step === 'signup_reveal') return <>Continue <ChevronRight size={18} style={{ marginLeft: '4px' }} /></>;
    if (step === 'email') {
      if (!emailChecked) return <>Continue <ChevronRight size={18} style={{ marginLeft: '4px' }} /></>;
      return isNewUser ? 'Sign up' : 'Log in';
    }
    return 'Continue';
  };

  return (
    <div className={styles.profileContainer}>
      <div className={styles.authContainer}>
        <header className={styles.authBrand}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
            Bankdrop<span className={styles.linkTag}>LINK</span>
          </h2>
        </header>

        <AnimatePresence mode="wait">
          {step !== 'otp' ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h1 className={styles.authTitle}>
                {isNewUser && emailChecked ? 'Create your Link account' : 'Welcome back'}
              </h1>
              <p className={styles.authSubtitle}>
                {isNewUser && emailChecked 
                  ? 'Join the network to manage all your bank rewards in one place.' 
                  : 'Log in or sign up to access your profile and rewards.'}
              </p>

              <form onSubmit={handleMainSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                <Input
                  label="Email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail size={18} />}
                  required
                  disabled={isLoadingAuth}
                  rightAddon={isLoadingAuth && step === 'email' && <Loader2 className="animate-spin" size={20} style={{ color: 'var(--brand-accent)' }} />}
                />

                <AnimatePresence>
                  {step === 'signup_reveal' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}
                    >
                      <Input
                        label="Full Name"
                        type="text"
                        placeholder="Jane Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={isLoadingAuth}
                      />
                      <Input
                        label="Mobile Number"
                        type="tel"
                        placeholder="+234 000 000 0000"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        required
                        disabled={isLoadingAuth}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button 
                  variant="accent" 
                  fullWidth 
                  size="large" 
                  type="submit" 
                  disabled={isLoadingAuth || (step === 'signup_reveal' && (!name || !mobile))}
                  style={{ marginTop: 'var(--spacing-md)' }}
                >
                  {getButtonLabel()}
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button 
                onClick={() => {
                  setAutoAdvanceEnabled(false);
                  setStep(isNewUser ? 'signup_reveal' : 'email');
                }} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  color: 'var(--text-secondary)', 
                  marginBottom: 'var(--spacing-xl)', 
                  border: 'none', 
                  background: 'none', 
                  cursor: 'pointer', 
                  padding: 0 
                }}
              >
                <ArrowLeft size={16} /> Back
              </button>

              <h1 className={styles.authTitle}>Verify identity</h1>
              <p className={styles.authSubtitle}>
                Enter the 6-digit code sent to <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{email}</span>
              </p>

              <OTPInput
                value={otp}
                onChange={setOtp}
                disabled={isLoadingAuth}
                onComplete={handleVerify}
              />

              {isLoadingAuth && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--spacing-lg)' }}>
                  <Loader2 className="animate-spin" color="var(--brand-accent)" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <footer className={styles.authFooter}>
          <ShieldCheck size={14} color="var(--brand-accent)" />
          Secured by Bankdrop Verification
        </footer>
      </div>
    </div>
  );
};
