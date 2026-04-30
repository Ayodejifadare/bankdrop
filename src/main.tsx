import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'
import { MerchantProvider } from './context/MerchantContext'
import { CustomerProvider } from './context/CustomerContext'
import { CustomerProfileProvider } from './context/CustomerProfileContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <MerchantProvider>
        <CustomerProfileProvider>
          <CustomerProvider>
            <App />
          </CustomerProvider>
        </CustomerProfileProvider>
      </MerchantProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
