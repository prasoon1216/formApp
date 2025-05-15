import React from 'react'
import { Route, Routes } from 'react-router-dom'
import HomePages from '../pages/HomePages'
import Blogs from '../pages/Blogs'
import ContactUs from '../pages/ContactUs'
import DailyProductionInput from '../pages/DailyProductionInput'
import OEEDashboard from '../pages/OEEDashboard'
import DailyProductionReport from '../pages/DailyProductionReport'
import Plan from '../pages/MachinePlan'
import Machines from '../pages/Machines'
import Calendar from '../pages/Calendar'



const AllRoute = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePages/>} />
      <Route path="/home" element={<HomePages/>} />
      <Route path="/blogs" element={<Blogs/>} />
      <Route path="/contact" element={<ContactUs/>} />
      <Route path="/form" element={<DailyProductionInput/>} />
      <Route path="/oee-dashboard" element={<OEEDashboard/>} />
      <Route path="/machine-plan" element={<Plan/>} />
      <Route path="/machines" element={<Machines/>} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/daily-production-report" element={<DailyProductionReport />} />
    </Routes>
  )
}

export default AllRoute
