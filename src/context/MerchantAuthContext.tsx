import React, { createContext, useContext, useState, useEffect } from 'react';

interface MerchantAuthContextType {
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  merchantUser: { name: string; email: string; mobile: string } | null;
  checkEmail: (email: string) => Promise<{ exists: boolean }>;
  login: (email: string, otp: string) => Promise<void>;
  signup: (userData: { name: string; email: string; mobile: string }, otp: string) => Promise<void>;
  logout: () => void;
}

const MerchantAuthContext = createContext<MerchantAuthContextType | undefined>(undefined);

export const MerchantAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('merchant_authenticated') === 'true';
  });

  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [merchantUser, setMerchantUser] = useState<{ name: string; email: string; mobile: string } | null>(() => {
    const saved = localStorage.getItem('merchant_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('merchant_authenticated', isAuthenticated.toString());
    if (merchantUser) {
      localStorage.setItem('merchant_user', JSON.stringify(merchantUser));
    } else {
      localStorage.removeItem('merchant_user');
    }
  }, [isAuthenticated, merchantUser]);

  const checkEmail = async (email: string) => {
    setIsLoadingAuth(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoadingAuth(false);
    return { exists: email === 'merchant@bankdrop.dev' };
  };

  const login = async (email: string, _otp: string) => {
    setIsLoadingAuth(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const user = { name: 'Admin', email, mobile: '+234 000 000 0000' };
    setMerchantUser(user);
    setIsAuthenticated(true);
    setIsLoadingAuth(false);
  };

  const signup = async (userData: { name: string; email: string; mobile: string }, _otp: string) => {
    setIsLoadingAuth(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setMerchantUser(userData);
    setIsAuthenticated(true);
    setIsLoadingAuth(false);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setMerchantUser(null);
    localStorage.removeItem('merchant_authenticated');
    localStorage.removeItem('merchant_user');
  };

  return (
    <MerchantAuthContext.Provider value={{ 
      isAuthenticated, 
      isLoadingAuth, 
      merchantUser, 
      checkEmail, 
      login, 
      signup, 
      logout 
    }}>
      {children}
    </MerchantAuthContext.Provider>
  );
};

export const useMerchantAuth = () => {
  const context = useContext(MerchantAuthContext);
  if (context === undefined) {
    throw new Error('useMerchantAuth must be used within a MerchantAuthProvider');
  }
  return context;
};
