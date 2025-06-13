import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import api from './api';

// Set global axios defaults to use the local backend server


createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />

  </BrowserRouter>
)
