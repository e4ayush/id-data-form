"use client";

import { useState, useEffect } from "react";
import { API_URL } from "@/lib/api";

export default function SchoolsManagementPage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);


  // Fetch all schools on load
  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/schools`, {
        headers: { "X-Admin-Secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || "" }
      });
      const result = await res.json();
      setSchools(result.data || []);
    } catch (error) {
      console.error("Failed to fetch schools:", error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleDeleteSchool = async (id: string, name: string) => {
    // Safety check so you don't accidentally delete a school!
    const confirmDelete = window.confirm(`DANGER: Are you sure you want to permanently delete "${name}" and ALL of its students? This cannot be undone.`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API_URL}/schools/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || ""
        }
      });
      
      if (res.ok) {
        // Remove from UI and clear local storage if it was the active school
        setSchools(schools.filter(s => s.id !== id));
        const active = localStorage.getItem("bizeraActiveSchool");
        if (active && JSON.parse(active).id === id) {
          localStorage.removeItem("bizeraActiveSchool");
        }
      }
    } catch (error) {
      console.error("Failed to delete school:", error);
      alert("Failed to delete the school. Check console.");
    }
  };

  const handleResetPassword = async (id: string, name: string) => {
    const confirmReset = window.confirm(`Are you sure you want to reset the password for "${name}"?`);
    if (!confirmReset) return;

    try {
      const res = await fetch(`${API_URL}/schools/${id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || ""
        }
      });
      
      const result = await res.json();
      if (res.ok) {
        alert(`Success! Tell the school admin their new credentials:\n\nEmail: ${result.email}\nNew Password: ${result.new_password}\n\nPlease copy these now, they will not be shown again!`);
      } else {
        alert(`Failed: ${result.detail || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to reset password:", error);
      alert("Failed to reset password. Check console.");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Schools Management</h2>
        <p className="text-gray-500 mt-1">Super Admin Panel: Register branches, view system data, and manage access.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats instead of duplicate form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-8 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Overview</h3>
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-center">
              <div className="text-4xl font-black text-indigo-600">{schools.length}</div>
              <div className="text-sm text-indigo-500 font-medium mt-1">Registered Schools</div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              To register a new school, go to <span className="font-semibold text-gray-600">Data Injection</span> page. Credentials are shown only once at creation time.
            </p>
          </div>
        </div>

        {/* Right Column: Schools Data Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-800">Active Database</h3>
              <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                {schools.length} Schools Total
              </span>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading schools...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white border-b border-gray-100 text-gray-500 uppercase tracking-wider text-xs">
                    <tr>
                      <th className="px-6 py-4 font-semibold">School Name</th>
                      <th className="px-6 py-4 font-semibold">Login Email</th>
                      <th className="px-6 py-4 font-semibold">Database ID</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {schools.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                          No schools registered yet.
                        </td>
                      </tr>
                    ) : (
                      schools.map((school) => (
                        <tr key={school.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">{school.name}</td>
                          <td className="px-6 py-4 text-gray-600 font-medium">
                            {school.login_email || 'Not set'}
                          </td>
                          <td className="px-6 py-4 text-gray-400 font-mono text-xs truncate max-w-[150px]">
                            {school.id}
                          </td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                            <button 
                              className="text-gray-600 hover:text-indigo-600 font-medium text-xs bg-gray-50 hover:bg-indigo-50 px-3 py-1.5 rounded-md transition-colors border border-gray-200 hover:border-indigo-200"
                              onClick={() => handleResetPassword(school.id, school.name)}
                            >
                              Reset Pass
                            </button>
                            <button 
                              onClick={() => handleDeleteSchool(school.id, school.name)}
                              className="text-red-600 hover:text-white font-medium text-xs bg-red-50 hover:bg-red-600 px-3 py-1.5 rounded-md transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}