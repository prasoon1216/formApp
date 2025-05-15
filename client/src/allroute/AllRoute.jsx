import React from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import HomePages from '../pages/HomePages'
import Blogs from '../pages/Blogs'
import ContactUs from '../pages/ContactUs'
import DailyProductionInput from '../pages/DailyProductionInput'
import OEEDashboard from '../pages/OEEDashboard'
import DailyProductionReport from '../pages/DailyProductionReport'
import Plan from '../pages/MachinePlan'
import Machines from '../pages/Machines'
import Calendar from '../pages/Calendar'

// PrivateRoute wrapper
const PrivateRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

const AllRoute = () => {
  return (
    <Routes>
      <Route path="/home" element={<PrivateRoute><HomePages/></PrivateRoute>}  />
      <Route path="/blogs" element={<PrivateRoute><Blogs/></PrivateRoute>}  />
      <Route path="/contact" element={<PrivateRoute><ContactUs/></PrivateRoute>}  />
      <Route path="/form" element={<PrivateRoute><DailyProductionInput/></PrivateRoute>}  />
      <Route path="/oee-dashboard" element={<PrivateRoute><OEEDashboard/></PrivateRoute>} />
      <Route path="/machine-plan" element={<PrivateRoute><Plan/></PrivateRoute>}  />
      <Route path="/machines" element={<PrivateRoute><Machines/></PrivateRoute>}  />
      <Route path="/calendar" element={<PrivateRoute><Calendar /></PrivateRoute>} />
      <Route path="/daily-production-report" element={<PrivateRoute><DailyProductionReport /></PrivateRoute>} />
    </Routes>
  )
}

export default AllRoute
