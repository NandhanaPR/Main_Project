import React, { useEffect, useState } from "react";
import OptimizationPage from "./pages/op";
import LeakDetectionPage from "./pages/leak";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // --- GLOBAL AI STATE ---
  // This lives here so it never resets when you change tabs
  const [liveData, setLiveData] = useState({ 
    rpm: 0, 
    speed: 0, 
    map: 0, 
    score: 0, 
    anomaly: false 
  });
  const [systemHealth, setSystemHealth] = useState("Normal");
  const [optimizationGain, setOptimizationGain] = useState(20.46);
  const [flowRate, setFlowRate] = useState(49.75);

  // THE MASTER FETCH FUNCTION
  const fetchAIUpdate = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/leak");
      const data = await res.json();

      if (data.error) return;

      // Update the global state
      setLiveData(data);
      setSystemHealth(data.anomaly ? "Critical" : "Normal");
    } catch (err) {
      console.log("Background AI Syncing...");
    }
  };

  useEffect(() => {
    // START MODELS IMMEDIATELY ON LOAD
    fetchAIUpdate(); 
    const aiTimer = setInterval(fetchAIUpdate, 3000);

    // Dummy data for Optimization (Parallel to AI)
    const dummyTimer = setInterval(() => {
      setOptimizationGain((15 + Math.random() * 10).toFixed(2));
      setFlowRate((45 + Math.random() * 10).toFixed(2));
    }, 3000);

    return () => {
      clearInterval(aiTimer);
      clearInterval(dummyTimer);
    };
  }, []);

  const healthColor = {
    Normal: "text-green-600",
    Warning: "text-yellow-600",
    Critical: "text-red-700",
  }[systemHealth];

  // Helper for Navigation
  const TabButton = ({ name, tabKey }) => (
    <button
      onClick={() => setActiveTab(tabKey)}
      className={`px-4 py-2 text-sm font-semibold transition-all duration-200 
        ${activeTab === tabKey 
          ? 'bg-white text-violet-800 border-l-4 border-violet-800 shadow-lg' 
          : 'text-white border-l-4 border-transparent hover:bg-violet-700'}`}
    >
      {name}
    </button>
  );

  const renderDashboard = () => (
    <div className="p-8 bg-gray-50 h-screen overflow-hidden flex flex-col"> 
      <h2 className="text-2xl font-bold text-gray-800 mb-8">Vehicle Telemetry Dashboard</h2>
      <div className="grid grid-cols-3 gap-8 mb-8">
        <MetricCard title="Optimization Gain" value={optimizationGain} unit="%" color="orange" isGain />
        
        {/* System Health reacts to liveData.anomaly */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col justify-between h-40 border-l-4 border-violet-500">
          <div className="flex justify-between items-start">
            <div className={`text-6xl font-extrabold ${healthColor} ${systemHealth === 'Critical' ? 'animate-pulse' : ''}`}>
              {systemHealth}
            </div>
          </div>
          <div className="text-sm text-gray-500 font-bold uppercase tracking-widest">SYSTEM HEALTH (AI LIVE)</div>
        </div>

        <MetricCard title="Current Flow" value={flowRate} unit="L/h" color="blue" />
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-lg p-6 overflow-auto">
        <h3 className="text-xl font-bold mb-4 text-violet-800 border-b pb-2">Parallel Processing Engine</h3>
        <p className="text-gray-600">The LSTM Autoencoder is running in a background service. Telemetry is being synchronized across all views.</p>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between px-8 py-5 bg-purple-700 text-white shadow-xl h-20"> 
        <h1 className="text-3xl font-extrabold tracking-wider">FUEL SYSTEM ANALYTICS</h1>
        <div className="flex space-x-0">
          <TabButton name="Dashboard" tabKey="dashboard" />
          <TabButton name="Optimization" tabKey="optimization" />
          <TabButton name="Leak Detection" tabKey="leak" />
        </div>
      </div>

      {activeTab === "dashboard" && renderDashboard()}
      {activeTab === "optimization" && <OptimizationPage />}
      
      {/* PASSING THE LIVE DATA TO THE LEAK PAGE */}
      {activeTab === "leak" && <LeakDetectionPage liveData={liveData} />}
    </div>
  );
}

function MetricCard({ title, value, unit, color, isGain }) {
  const textColor = isGain ? "text-green-600" : "text-blue-700";
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col justify-between h-40 border-l-4 border-violet-500">
      <div className="text-6xl font-extrabold shadow-sm tabular-nums">
        <span className={textColor}>{value}</span>
        <span className="text-3xl font-bold ml-1 text-gray-400">{unit}</span>
      </div>
      <div className="text-sm text-gray-500 font-bold uppercase tracking-widest">{title}</div>
    </div>
  );
}