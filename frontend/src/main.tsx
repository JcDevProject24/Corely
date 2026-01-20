import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { CorelyApp } from './CorelyApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CorelyApp />
  </StrictMode>,
)
