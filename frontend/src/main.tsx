import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from './contexts/ToastContext'
import { CarreraProvider } from './contexts/CarreraContext'
import { AuthProvider } from './contexts/AuthContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CarreraProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </CarreraProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
