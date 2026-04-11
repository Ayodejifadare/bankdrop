import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomerProfile } from '../../context/CustomerProfileContext';
import styles from './ProfileUI.module.css';
import { Button } from '../ui/Button';
import { ChevronRight, ShieldCheck, Mail, ArrowLeft, Loader2 } from 'lucide-react';

interface Props {
  onExit: () => void;
}

type AuthStep = 'email' | 'signup_reveal' | 'otp';

export const ProfileAuth: React.FC<Props> = ({ onExit }) => {
  const { checkEmail, login, signup, isLoadingAuth } = useCustomerProfile();
  
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isNewUser, setIsNewUser] = useState(false);
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'email') {
      const { exists } = await checkEmail(email);
      if (exists) {
        setStep('otp');
      } else {
        setIsNewUser(true);
        setStep('signup_reveal');
      }
    } else if (step === 'signup_reveal') {
      setStep('otp');
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit if complete
    if (newOtp.every(digit => digit !== '') && index === 5) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleVerify = async (code: string) => {
    if (isNewUser) {
      await signup({ email, name, mobile }, code);
    } else {
      await login(email, code);
    }
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
                {isNewUser ? 'Create your Link account' : 'Welcome to Bankdrop'}
              </h1>
              <p className={styles.authSubtitle}>
                Log in or sign up to get started.
              </p>

              <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="email" 
                      className={styles.input} 
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ paddingLeft: '40px' }}
                      required
                      disabled={step === 'signup_reveal' || isLoadingAuth}
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {step === 'signup_reveal' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}
                    >
                      <div className={styles.inputGroup}>
                        <label className={styles.label}>Full Name</label>
                        <input 
                          type="text" 
                          className={styles.input} 
                          placeholder="Jane Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          disabled={isLoadingAuth}
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label className={styles.label}>Mobile Number</label>
                        <input 
                          type="tel" 
                          className={styles.input} 
                          placeholder="+234 000 000 0000"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          required
                          disabled={isLoadingAuth}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button 
                  variant="accent" 
                  fullWidth 
                  size="large" 
                  type="submit" 
                  disabled={isLoadingAuth}
                  style={{ marginTop: 'var(--spacing-md)' }}
                >
                  {isLoadingAuth ? <Loader2 className="animate-spin" size={20} /> : (
                    <>Continue <ChevronRight size={18} style={{ marginLeft: '4px' }} /></>
                  )}
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
              <button onClick={() => setStep(isNewUser ? 'signup_reveal' : 'email')} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)' }}>
                <ArrowLeft size={16} /> Back
              </button>

              <h1 className={styles.authTitle}>Verify your identity</h1>
              <p className={styles.authSubtitle}>
                Enter the 6-digit code sent to <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{email}</span>
              </p>

              <div className={styles.otpGrid}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    className={styles.otpField}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !digit && idx > 0) {
                        otpRefs.current[idx - 1]?.focus();
                      }
                    }}
                    disabled={isLoadingAuth}
                  />
                ))}
              </div>

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
