import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'

// Set global axios defaults to use the deployed backend
axios.defaults.baseURL = 'https://formapp-351i.onrender.com'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />

  </BrowserRouter>
)
