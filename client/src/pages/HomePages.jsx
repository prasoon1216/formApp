import React from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  // Define dashboard buttons with id, title, and route
  const buttons = [
    { id: 1, title: "Jobs Dashboard", route: "/jobs-dashboard" },
    { id: 2, title: "OEE Dashboard", route: "/oee-dashboard" },
    { id: 3, title: "Gantt Chart Jobs", route: "/gantt-chart" },
    { id: 4, title: "Job History", route: "/job-history" },
    { id: 5, title: "Daily Production Input", route: "/form" },
    { id: 6, title: "Machine Planning", route: "/machine-plan" },
    { id: 7, title: "Machines", route: "/machines" },
    { id: 8, title: "Calendar", route: "/calendar" },
    { id: 9, title: "Daily Production Report", route: "/daily-production-report" }
  ];

  const disabledIds = [1, 3, 4]; // Jobs Dashboard, Gantt Chart Jobs, Job History

  const handleButtonClick = (route) => {
    navigate(route);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-400 to-indigo-3x00">
      {/* Logo Section */}
      <div className="absolute top-6 left-6">
        {/* <img src="/logo.png" alt="Allied Medical" className="h-12 drop-shadow-lg" /> */}
      </div>
      
      {/* Glassmorphic Dashboard Container */}
      <div className="bg-white/35 backdrop-blur-lg shadow-7xl p-8 rounded-4xl max-w-5xl w-full h-5/6 text-center">
        <h1 className="text-3xl font-bold mb-6">Welcome to the Production Management System</h1>
        
        {/* Dashboard Buttons Grid */}
        <div className="text-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {buttons.map((button) => (
            <button
              key={button.id}
              onClick={() => !disabledIds.includes(button.id) && handleButtonClick(button.route)}
              className={`w-60 h-20 justify-self-center font-bold rounded-2xl shadow-lg transition transform text-blue-600 bg-slate-200 hover:scale-105 hover:bg-blue-500 hover:text-white ${
                disabledIds.includes(button.id)
                  ? 'bg-gray-300 text-gray-400 cursor-not-allowed opacity-60 hover:bg-gray-300 hover:text-gray-400'
                  : ''
              }`}
              disabled={disabledIds.includes(button.id)}
            >
              {button.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
