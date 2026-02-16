import React, { useState, useEffect, useRef, useCallback } from 'react';
import Chart from 'chart.js/auto';

const NUM_SAMPLES = 20;

// Initialize with zeros so the graph starts clean and waits for real data
const initialTrims = Array(NUM_SAMPLES).fill(0);
const initialOptimized = Array(NUM_SAMPLES).fill(0);

export default function OptimizationPage() {
  const [trims, setTrims] = useState(initialTrims);
  const [optimizedTrims, setOptimizedTrims] = useState(initialOptimized);

  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const initChart = useCallback((canvas) => {
    if (chartInstanceRef.current) chartInstanceRef.current.destroy();

    chartInstanceRef.current = new Chart(canvas, {
      type: 'line',
      data: {
        labels: trims.map((_, i) => `T-${trims.length - 1 - i}`),
        datasets: [
          {
            label: 'Previous Fuel Trim (%)',
            data: trims,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37,99,235,0.15)',
            borderWidth: 3,
            tension: 0.4,
            pointRadius: 4,
          },
          {
            label: 'Optimized Fuel Trim (%)',
            data: optimizedTrims,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239,68,68,0.15)',
            borderWidth: 3,
            tension: 0.4,
            pointRadius: 4,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          y: { 
            min: -15, 
            max: 15, 
            title: { display: true, text: 'Fuel Trim (%)' } 
          },
          x: { 
            title: { display: true, text: 'Time Sample (Most Recent on Right)' } 
          }
        }
      }
    });
  }, [trims, optimizedTrims]);

  useEffect(() => {
    initChart(chartRef.current);

    // Function to fetch real data from your backend
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/optimization');
        const data = await response.json();

        // Ensure we have valid numbers before updating state
        if (data.actual !== undefined && data.predicted !== undefined) {
          setTrims(prev => [...prev.slice(1), data.actual]);
          setOptimizedTrims(prev => [...prev.slice(1), data.predicted]);
        } else if (data.error) {
          console.error("Model Error:", data.error);
        }
      } catch (err) {
        console.error("Connection Error to Backend:", err);
      }
    };

    // Run immediately on load
    fetchData();

    // Set interval to fetch real predictions every 3 seconds
    const interval = setInterval(fetchData, 3000);

    return () => {
      clearInterval(interval);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [initChart]);

  return (
    <div className="p-10 bg-gray-100 min-h-screen">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-2">Fuel Trim Optimization</h2>
        <p className="text-gray-500 mb-6">
          Comparing real-time OBD fuel trims with XGBoost-optimized values.
        </p>

        <div className="h-[500px]">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>
    </div>
  );
}