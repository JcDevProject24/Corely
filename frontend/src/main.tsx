import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { CorelyApp } from './CorelyApp'
import { GoogleOAuthProvider } from '@react-oauth/google'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <CorelyApp />
    </GoogleOAuthProvider>
  </StrictMode>,
)
