import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from './contexts/ToastContext'
import { CarreraProvider } from './contexts/CarreraContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CarreraProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </CarreraProvider>
  </StrictMode>,
)
