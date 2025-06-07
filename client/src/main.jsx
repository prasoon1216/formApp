import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'

// Set global axios defaults to use the local backend server
axios.defaults.baseURL = 'http://localhost:10000'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />

  </BrowserRouter>
)
