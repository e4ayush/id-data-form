"use client";

import { useState, useEffect } from "react";
import { API_URL } from "@/lib/api";

export default function StatusIndicator() {
  const [apiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    // Initial check
    checkStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/`);
      setApiOnline(res.ok);
    } catch (error) {
      setApiOnline(false);
    }
  };

  return (
    <div className={`flex items-center text-sm font-medium ${apiOnline ? "text-green-600" : "text-red-500"}`}>
      <span className={`w-2 h-2 rounded-full mr-2 ${apiOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></span>
      {apiOnline ? "API Online" : "API Offline"}
    </div>
  );
}
