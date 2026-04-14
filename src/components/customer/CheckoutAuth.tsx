import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomerProfile } from '../../context/CustomerProfileContext';
import { Input } from '../ui/Input';
import { OTPInput } from '../ui/OTPInput';
import { Button } from '../ui/Button';
import { Loader2, X, ChevronRight } from 'lucide-react';

export const CheckoutAuth: React.FC = () => {
  const { checkEmail, login, signup, isLoadingAuth } = useCustomerProfile();
  const [email, setEmail] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'details' | 'otp'>('otp');
  const [autoPopEnabled, setAutoPopEnabled] = useState(true);

  const handleEmailSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) return;
    const { exists } = await checkEmail(email);
    setIsNewUser(!exists);
    setStep(!exists ? 'details' : 'otp');
    setShowPopup(true);
  };

  const [prevEmail, setPrevEmail] = useState('');

  // Debounced Email Autocheck
  useEffect(() => {
    // If email is cleared, re-enable auto-pop for the next intent
    if (!email) {
      setAutoPopEnabled(true);
      setPrevEmail('');
      return;
    }

    // TYPO RECOVERY: If the current email string is significantly different from the 
    // last checked one, re-enable the auto-pop.
    if (Math.abs(email.length - prevEmail.length) > 2) {
      setAutoPopEnabled(true);
    }

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmailValid) return;

    const timer = setTimeout(async () => {
      const { exists } = await checkEmail(email);
      setIsNewUser(!exists);
      setStep(!exists ? 'details' : 'otp');
      setPrevEmail(email);
      
      // AUTO-POP: Only trigger if the user hasn't explicitly dismissed the modal yet for this session
      if (autoPopEnabled) {
        setShowPopup(true);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [email, checkEmail, autoPopEnabled, prevEmail]);

  const handleVerify = async (code: string) => {
    if (isNewUser) {
      await signup({ email, name, mobile }, code);
    } else {
      await login(email, code);
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setAutoPopEnabled(false); // Stop nagging once dismissed
  };

  return (
    <>
      {/* --- FORM RESTORED (The original inline layout) --- */}
      <div style={{
        marginTop: 'var(--spacing-lg)',
        backgroundColor: 'var(--bg-secondary)',
        padding: '16px',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--border-primary)'
      }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>
          Sign in to use & earn rewards
        </div>
        <form onSubmit={handleEmailSubmit} style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoadingAuth}
            />
          </div>
          <Button type="submit" variant="accent" disabled={isLoadingAuth || !email} style={{ padding: '0 16px', minWidth: '54px' }}>
            {isLoadingAuth ? <Loader2 className="animate-spin" size={18} /> : <ChevronRight size={18} />}
          </Button>
        </form>
      </div>

      <AnimatePresence>
        {showPopup && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{
                backgroundColor: 'var(--bg-primary)',
                padding: '32px 24px',
                borderRadius: 'var(--radius-xl)',
                width: '100%',
                maxWidth: '400px',
                position: 'relative',
                border: '1px solid var(--border-secondary)'
              }}
            >
              <button 
                onClick={handleClosePopup}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'var(--bg-tertiary)',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>

              {step === 'details' && isNewUser ? (
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
                    Create Account
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px' }}>
                    Let's get you set up to earn rewards on this visit.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Input label="Full Name" type="text" placeholder="Jane Doe" value={name} onChange={e => setName(e.target.value)} required disabled={isLoadingAuth} />
                    <Input label="Mobile Number" type="tel" placeholder="+234 000..." value={mobile} onChange={e => setMobile(e.target.value)} required disabled={isLoadingAuth} />
                    <Button variant="accent" fullWidth size="large" onClick={() => setStep('otp')} disabled={!name || !mobile} style={{ marginTop: '8px' }}>
                      Continue to Verification
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
                    Verify Identity
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px', lineHeight: 1.5 }}>
                    Enter the 6-digit code sent to <br/><strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
                  </p>
                  <OTPInput value={otp} onChange={setOtp} disabled={isLoadingAuth} onComplete={handleVerify} />
                  {isLoadingAuth && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                      <Loader2 className="animate-spin" color="var(--brand-accent)" />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
