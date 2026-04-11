import React, { useRef } from 'react';
import styles from './OTPInput.module.css';

interface OTPInputProps {
  length?: number;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  onComplete?: (code: string) => void;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChange,
  disabled = false,
  onComplete,
}) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, inputValue: string) => {
    if (inputValue.length > 1) inputValue = inputValue[0];
    const newValue = [...value];
    newValue[index] = inputValue;
    onChange(newValue);

    // Auto-focus next field
    if (inputValue && index < length - 1) {
      refs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (newValue.every(digit => digit !== '') && index === length - 1) {
      onComplete?.(newValue.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <div className={styles.otpGrid}>
      {Array.from({ length }, (_, idx) => (
        <input
          key={idx}
          ref={(el) => (refs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          className={styles.otpField}
          value={value[idx] || ''}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          disabled={disabled}
          maxLength={1}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
};
