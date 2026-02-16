import React, { useState, useEffect } from "react";

export default function LeakDetectionPage({ liveData }) {
  const [alerts, setAlerts] = useState([]);

  // This effect handles the Alert history
  useEffect(() => {
    if (liveData && liveData.anomaly) {
      const newAlert = {
        id: Date.now(),
        message: `Leak Detected (Score: ${liveData.score.toFixed(4)})`,
        time: new Date().toLocaleTimeString()
      };

      // Keeps the last 5 alerts, newest on top
      setAlerts(prev => [newAlert, ...prev.slice(0, 4)]);
    }
  }, [liveData.anomaly, liveData.score]);

  const status = liveData.anomaly ? "ANOMALY" : "NORMAL";

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Status Banner */}
        <div className={`p-6 rounded-2xl mb-8 text-white flex justify-between items-center shadow-lg transition-colors duration-500 
          ${status === 'NORMAL' ? 'bg-emerald-500' : 'bg-red-600 animate-pulse'}`}>
          <div>
            <h1 className="text-3xl font-bold">Fuel System Health</h1>
            <p className="opacity-80">LSTM Autoencoder Monitoring (Live)</p>
          </div>
          <div className="text-5xl font-black">{status}</div>
        </div>

        {/* Dynamic Metric Cards with specific colors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard title="Engine Speed" value={liveData.rpm} unit="RPM" color="orange" />
          <MetricCard title="Intake Pressure" value={liveData.map} unit="kPa" color="blue" />
          <MetricCard title="Vehicle Speed" value={liveData.speed} unit="km/h" color="cyan" />
        </div>

        {/* Reconstruction Error Display */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col md:flex-row items-center gap-10">
          <div className="text-center">
            <h3 className="text-gray-400 font-bold uppercase text-xs tracking-widest mb-2">Reconstruction Error</h3>
            <div className={`text-6xl font-black ${liveData.anomaly ? 'text-red-600' : 'text-purple-600'}`}>
              {liveData.score ? liveData.score.toFixed(4) : "0.0000"}
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <div className="text-sm text-gray-600 leading-relaxed">
              The AI model reconstructs signals based on healthy patterns. A high error indicates that current sensor correlations do not match a healthy engine state.
            </div>
            <div className="text-xs font-mono text-gray-400">Threshold: 0.1643 | Features: 7 | Window: 15s</div>
          </div>
        </div>

        {/* Alerts Section (Stacked list) */}
        <div className="mt-10">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Detection History</h3>
          {alerts.length === 0 ? (
            <div className="p-10 text-center border-2 border-dashed rounded-2xl text-gray-300 font-medium">
              Scanning live data streams... No anomalies detected.
            </div>
          ) : (
            <div className="flex flex-col gap-3"> {/* This ensures "below by below" stacking */}
              {alerts.map(a => (
                <div key={a.id} className="flex justify-between items-center bg-red-50 p-4 rounded-xl border-l-8 border-red-600 shadow-md">
                  <div className="flex flex-col">
                    <span className="font-bold text-red-800 text-lg">{a.message}</span>
                    <span className="text-red-400 text-xs font-bold uppercase tracking-tight">System Status: Critical</span>
                  </div>
                  <span className="text-gray-500 font-mono bg-white px-3 py-1 rounded-full shadow-sm text-sm">
                    {a.time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Fixed MetricCard to handle the colors you requested
function MetricCard({ title, value, unit, color }) {
  const colors = {
    orange: "border-orange-500 text-orange-600",
    blue: "border-blue-500 text-blue-600",
    cyan: "border-cyan-500 text-cyan-600"
  };
  
  return (
    <div className={`bg-white p-6 rounded-2xl shadow-md border-b-8 transition-transform hover:scale-105 duration-300 ${colors[color]}`}>
      <div className="text-gray-400 text-xs font-bold uppercase mb-1 tracking-wider">{title}</div>
      <div className="text-4xl font-black flex items-baseline gap-2">
        {value} 
        <span className="text-lg font-bold opacity-40">{unit}</span>
      </div>
    </div>
  );
}