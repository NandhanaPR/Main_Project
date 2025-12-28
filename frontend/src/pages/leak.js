import React, { useEffect, useState } from "react";

export default function LeakDetectionPage() {
  const [metrics, setMetrics] = useState({ rpm: 0, lambda: 0, map: 0, score: 0 });
  const [status, setStatus] = useState("NORMAL");
  const [alerts, setAlerts] = useState([]);

  const fetchUpdate = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/leak");
      const data = await res.json();

      if (data.error) return console.error(data.error);

      setMetrics({
        rpm: data.rpm,
        lambda: data.lambda,
        map: data.map,
        score: data.score
      });

      if (data.anomaly) {
        setStatus("ANOMALY");
        setAlerts(prev => [{
          id: Date.now(),
          message: `Leak Detected (Score: ${data.score.toFixed(4)})`,
          time: new Date().toLocaleTimeString()
        }, ...prev.slice(0, 4)]);
      } else {
        setStatus("NORMAL");
      }
    } catch (err) {
      console.log("Waiting for backend...");
    }
  };

  useEffect(() => {
    fetchUpdate();
    const timer = setInterval(fetchUpdate, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-6xl mx-auto">
        <div className={`p-6 rounded-2xl mb-8 text-white flex justify-between items-center shadow-lg transition-colors duration-500 ${status === 'NORMAL' ? 'bg-emerald-500' : 'bg-red-600 animate-pulse'}`}>
          <div>
            <h1 className="text-3xl font-bold">Fuel System Health</h1>
            <p className="opacity-80">LSTM Autoencoder Monitoring</p>
          </div>
          <div className="text-5xl font-black">{status}</div>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard title="Engine Speed" value={metrics.rpm} unit="RPM" color="orange" />
          <MetricCard title="Intake Pressure" value={metrics.map} unit="kPa" color="blue" />
          <MetricCard title="Air-Fuel Ratio" value={metrics.lambda.toFixed(3)} unit="λ" color="cyan" />
        </div>

        {/* Anomaly Analysis Card */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col md:flex-row items-center gap-10">
          <div className="text-center">
            <h3 className="text-gray-400 font-bold uppercase text-xs tracking-widest mb-2">Reconstruction Error</h3>
            <div className={`text-6xl font-black ${metrics.score > 0.2671 ? 'text-red-600' : 'text-purple-600'}`}>
              {metrics.score.toFixed(4)}
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <div className="text-sm text-gray-600 leading-relaxed">
              The AI model reconstructs signals based on healthy patterns. A high error indicates that current sensor correlations (RPM vs MAP vs Lambda) do not match a healthy engine state, signaling a potential <b>Fuel Leak</b>.
            </div>
            <div className="text-xs font-mono text-gray-400">Threshold: 0.2671 | Features: 6 | Window: 15s</div>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="mt-10">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Detection History</h3>
          {alerts.length === 0 ? (
            <div className="p-10 text-center border-2 border-dashed rounded-2xl text-gray-300">Scanning data streams...</div>
          ) : (
            <div className="space-y-2">
              {alerts.map(a => (
                <div key={a.id} className="flex justify-between bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                  <span className="font-bold text-red-700">{a.message}</span>
                  <span className="text-gray-400 text-sm">{a.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, unit, color }) {
  const colors = {
    orange: "border-orange-500 text-orange-600",
    blue: "border-blue-500 text-blue-600",
    cyan: "border-cyan-500 text-cyan-600"
  };
  return (
    <div className={`bg-white p-6 rounded-2xl shadow-md border-b-4 ${colors[color]}`}>
      <div className="text-gray-400 text-xs font-bold uppercase mb-1">{title}</div>
      <div className="text-4xl font-black">{value} <span className="text-lg font-normal">{unit}</span></div>
    </div>
  );
}