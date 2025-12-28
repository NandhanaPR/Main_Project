import React, { useState, useEffect } from "react";
import OptimizationPage from "./pages/op";
import LeakDetectionPage from "./pages/leak";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // ================================
  // DUMMY DATA – REPLACE WHEN MODEL IS INTEGRATED
  // ================================

  const [optimizationGain, setOptimizationGain] = useState(20.46);
  const [systemHealth, setSystemHealth] = useState("Normal");
  const [flowRate, setFlowRate] = useState(49.75);

  useEffect(() => {
    const interval = setInterval(() => {
      // Dummy simulation
      // **ADJUSTMENT:** Constraining the random range (10 to 25) to frequently hit all health statuses for testing.
      const minGain = 10;
      const maxGain = 25;
      // Generates a number between 10 and 25
      const gain = (minGain + Math.random() * (maxGain - minGain)).toFixed(2);
      
      const flow = (40 + Math.random() * 20).toFixed(2);

      setOptimizationGain(gain);
      setFlowRate(flow);

      // System Health Logic: Normal > Warning > Critical
      // **ADJUSTMENT:** Ensuring the strings used here match the healthColor map exactly.
      if (gain < 15) { // Increased severity threshold for testing
        setSystemHealth("Critical"); 
      } else if (gain < 20) { // Increased warning threshold for testing
        setSystemHealth("Warning");
      } else {
        setSystemHealth("Normal");
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Health Color Mapping (using the requested Critical/Warning names)
  const healthColor = {
    // These strings must match the setSystemHealth calls above.
    Normal: "text-green-600",
    Warning: "text-yellow-600",
    Critical: "text-red-700",
  }[systemHealth];

  // Helper function for rendering highly compact professional navigation buttons
  const TabButton = ({ name, tabKey }) => (
    <button
      onClick={() => setActiveTab(tabKey)}
      // Increased text size (text-sm), increased padding (px-4, py-2)
      className={`
        px-4 py-2 text-sm font-semibold transition-all duration-200 ease-in-out
        ${activeTab === tabKey 
          // Removed border-b-2, added shadow-lg for bulge effect, added left border (border-l-4)
          ? 'bg-white text-violet-800 border-l-4 border-violet-800 shadow-lg' 
          : 'text-white border-l-4 border-transparent hover:bg-violet-700 hover:text-white' 
        }
      `}
    >
      {name}
    </button>
  );

  const renderDashboard = () => (
    // Fixed Height Container (100vh) - **Ensures No Scroll**
    <div className="p-8 bg-gray-50 h-screen overflow-hidden flex flex-col"> 
      
      {/* Main Dashboard Title - Slightly Larger */}
      <h2 className="text-2xl font-bold text-gray-800 mb-8">
        Vehicle Telemetry & Optimization Dashboard
      </h2>

      {/* Top Metrics Row - Compact Design */}
      <div className="grid grid-cols-3 gap-8 mb-8">
        
        {/* Metric Card: Optimization Gain */}
        <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 p-6 flex flex-col justify-between h-40 border-l-4 border-violet-500">
          <div className="flex justify-between items-start">
            {/* Value size increased (text-6xl), made bold (font-extrabold) */}
            <div className="text-6xl font-extrabold text-green-600 tabular-nums">
                {optimizationGain} 
                <span className="text-3xl font-bold">%</span>
            </div>
            <svg className="w-8 h-8 text-green-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-5.618 2.04C3.24 5.707 2 7.587 2 9.539V20l4-4h14a2 2 0 002-2V9.539c0-1.952-1.24-3.832-3.382-4.597z"></path></svg>
          </div>
          {/* Label size increased (text-sm) */}
          <div className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-3">OPTIMIZATION GAIN</div>
        </div>

        {/* Metric Card: System Health */}
        <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 p-6 flex flex-col justify-between h-40 border-l-4 border-violet-500">
          <div className="flex justify-between items-start">
            {/* Value size increased (text-6xl), made bold (font-extrabold) */}
            {/* Now uses healthColor for text color */}
            <div className={`text-6xl font-extrabold ${healthColor}`}>{systemHealth}</div>
            <svg className={`w-8 h-8 ${healthColor} mt-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.38 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          {/* Label size increased (text-sm) */}
          <div className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-3">SYSTEM HEALTH</div>
        </div>

        {/* Metric Card: Flow Rate */}
        <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 p-6 flex flex-col justify-between h-40 border-l-4 border-violet-500">
          <div className="flex justify-between items-start">
            {/* Value size increased (text-6xl), made bold (font-extrabold) */}
            <div className="text-6xl font-extrabold text-blue-700 tabular-nums">
                {flowRate} 
                <span className="text-3xl font-bold">L/h</span>
            </div>
            <svg className="w-8 h-8 text-blue-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          {/* Label size increased (text-sm) */}
          <div className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-3">CURRENT FLOW RATE</div>
        </div>
      </div>

      {/* Architecture and Detail View - Takes remaining vertical space */}
      <div className="flex-1 bg-white rounded-xl shadow-lg p-6 overflow-auto">
        <h3 className="text-xl font-bold mb-4 text-violet-800 border-b pb-2">Architecture Overview</h3>
        <p className="text-base text-gray-600 mb-4">
          This system integrates OBD data collection for two parallel, data-driven models:
        </p>
        <ul className="list-disc pl-6 space-y-3 text-base text-gray-700">
          <li>
            <b className="text-gray-900">Fuel Trim Optimization:</b> Uses an **LSTM Regressor** trained on historical vehicle and simulator data to predict optimal fuel trims, aiming for maximum efficiency and lower emissions.
          </li>
          <li>
            <b className="text-gray-900">Fuel Leak Detection:</b> Uses an **LSTM Autoencoder** trained on normal operating parameters (flow, pressure, velocity). Deviations result in a high anomaly score, flagging a potential leak and issuing **Critical** alerts.
          </li>
        </ul>
        <p className="mt-6 text-sm text-gray-500 italic">
          (Placeholder for a technical diagram showing the data flow into the two parallel LSTM models.)
        </p>
      </div>
    </div>
  );

  const renderBlank = (title) => (
    // Fixed Height for No Scroll, increased padding (p-8)
    <div className="p-8 bg-gray-50 h-screen overflow-hidden">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
      {/* Added shadow-lg */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <p className="text-base text-gray-600">
          This panel is dedicated to advanced model outputs. Integrate fine-grained analytics, historical trends, and model tuning parameters here.
        </p>
      </div>
    </div>
  );

  return (
    <div>
      {/* Top Navigation - Compact Violet Header (h-16) - Slightly taller */}
      <div className="flex items-center justify-between px-8 py-5 bg-purple-700 text-white shadow-xl h-20"> 
        <h1 className="text-3xl font-extrabold tracking-wider">
          FUEL SYSTEM ANALYTICS
        </h1>
        <div className="flex space-x-0">
          {/* space-x-0 to remove gap between tabs for a connected look */}
          <TabButton name="Dashboard" tabKey="dashboard" />
          <TabButton name="Optimization" tabKey="optimization" />
          <TabButton name="Leak Detection" tabKey="leak" />
        </div>
      </div>

      {/* Content */}
      {activeTab === "dashboard" && renderDashboard()}
      {activeTab === "optimization" && <OptimizationPage />}
      {activeTab === "leak" && <LeakDetectionPage />}
    </div>
  );
}