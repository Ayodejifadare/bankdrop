import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'
import { MerchantProvider } from './context/MerchantContext'
import { CustomerProvider } from './context/CustomerContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <MerchantProvider>
        <CustomerProvider>
          <App />
        </CustomerProvider>
      </MerchantProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
