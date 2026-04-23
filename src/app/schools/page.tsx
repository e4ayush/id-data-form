"use client";

import { useState, useEffect } from "react";
import { API_URL } from "@/lib/api";
import { Modal } from "@/components/Modal";

export default function SchoolsManagementPage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const filteredSchools = schools.filter((s: any) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Modal States
  const [deleteData, setDeleteData] = useState<{ id: string, name: string } | null>(null);
  const [resetData, setResetData] = useState<{ id: string, name: string } | null>(null);
  const [newCredentials, setNewCredentials] = useState<{ email: string, password: string } | null>(null);
  
  // Processing States
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);


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


  // MODAL HANDLERS
  const confirmDeleteSchool = async () => {
    if (!deleteData) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`${API_URL}/schools/${deleteData.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || ""
        }
      });
      
      if (res.ok) {
        setSchools(schools.filter((s: any) => s.id !== deleteData.id));
        const active = localStorage.getItem("bizeraActiveSchool");
        if (active && JSON.parse(active).id === deleteData.id) {
          localStorage.removeItem("bizeraActiveSchool");
        }
        setDeleteData(null);
      } else {
        alert("Delete failed on backend.");
      }
    } catch (error) {
      console.error("Failed to delete school:", error);
    }
    setIsDeleting(false);
  };

  const confirmResetPassword = async () => {
    if (!resetData) return;
    setIsResetting(true);

    try {
      const res = await fetch(`${API_URL}/schools/${resetData.id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || ""
        }
      });
      
      const result = await res.json();
      if (res.ok) {
        setNewCredentials({ email: result.email, password: result.new_password });
      } else {
        alert(`Failed: ${result.detail || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to reset password:", error);
    }
    setIsResetting(false);
  };



  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Schools Management</h2>
        <p className="text-gray-500 mt-1">Super Admin Panel: Register branches, view system data, and manage access.</p>
      </header>

      <div className="w-full">
        {/* Schools Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-800">Active Database</h3>
                <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                  {filteredSchools.length} Schools Total
                </span>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search schools..."
                  value={searchQuery}
                  onChange={(e: any) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading schools...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] table-fixed text-left text-sm">
                  <thead className="bg-white border-b border-gray-100 text-gray-500 uppercase tracking-wider text-xs">
                    <tr>
                      <th className="px-6 py-4 font-semibold w-[230px]">School Name</th>
                      <th className="px-6 py-4 font-semibold w-[280px]">Login Email</th>
                      <th className="px-6 py-4 font-semibold w-[160px]">Database ID</th>
                      <th className="sticky right-0 z-10 bg-white px-6 py-4 font-semibold text-right w-[170px] shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.35)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredSchools.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                          {searchQuery ? "No schools found matching your search." : "No schools registered yet."}
                        </td>
                      </tr>
                    ) : (
                      filteredSchools.map((school: any) => (
                        <tr key={school.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">
                            <span title={school.name} className="block truncate">{school.name}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 font-medium">
                            <span title={school.login_email || 'Not set'} className="block truncate">
                            {school.login_email || 'Not set'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-400 font-mono text-xs">
                            <span title={school.id} className="block truncate">
                            {school.id}
                            </span>
                          </td>
                          <td className="sticky right-0 bg-white px-6 py-4 text-right shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.35)]">
                            <div className="flex justify-end gap-2">
                            <button 
                              className="text-gray-600 hover:text-indigo-600 font-medium text-xs bg-gray-50 hover:bg-indigo-50 px-3 py-1.5 rounded-md transition-colors border border-gray-200 hover:border-indigo-200"
                              onClick={() => setResetData({ id: school.id, name: school.name })}
                            >
                              Reset Pass
                            </button>
                            <button 
                              onClick={() => setDeleteData({ id: school.id, name: school.name })}
                              className="text-red-600 hover:text-white font-medium text-xs bg-red-50 hover:bg-red-600 px-3 py-1.5 rounded-md transition-colors"
                            >
                              Delete
                            </button>
                            </div>
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
      {/* Modals placed globally below layout */}

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={deleteData !== null} 
        onClose={() => setDeleteData(null)} 
        title="Delete School Confirmation"
      >
        <div className="py-2">
          <p className="text-gray-600 mb-6">
            You are about to permanently delete <strong className="text-gray-900">{deleteData?.name}</strong> and <strong className="text-red-600">ALL</strong> of its associated students from the database.<br /><br />Are you absolutely sure? This action cannot be undone.
          </p>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setDeleteData(null)} className="flex-1 py-2.5 rounded-xl border border-gray-300 font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={confirmDeleteSchool} disabled={isDeleting} className="flex-1 py-2.5 rounded-xl bg-red-600 font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50">
              {isDeleting ? "Deleting..." : "Yes, Delete School"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Password Reset Flow Modal */}
      <Modal 
        isOpen={resetData !== null} 
        onClose={() => { setResetData(null); setNewCredentials(null); }} 
        title="Reset School Password"
      >
        <div className="py-2">
          {!newCredentials ? (
            <>
              <p className="text-gray-600 mb-6">
                Are you sure you want to forcibly reset the password for <strong className="text-gray-900">{resetData?.name}</strong>? They will instantly lose access using their current credentials.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setResetData(null)} className="flex-1 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                  Cancel
                </button>
                <button onClick={confirmResetPassword} disabled={isResetting} className="flex-1 py-2.5 bg-indigo-600 rounded-xl font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {isResetting ? "Resetting..." : "Confirm Reset"}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0 mb-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <div className="text-center">
                <h4 className="text-xl font-bold text-gray-900">Password Reset Complete</h4>
                <p className="text-sm text-gray-500 mt-1">Please provide the new credentials to the admin.</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mt-2 min-w-0">
                <p className="text-sm text-amber-800 mb-4 font-medium flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                  Copy the credentials now!
                </p>
                <div className="space-y-3 font-mono text-sm">
                  <div className="bg-white px-4 py-3 rounded-lg border border-amber-100 shadow-sm grid gap-1 sm:grid-cols-[110px_minmax(0,1fr)] sm:items-center">
                    <span className="text-gray-400 select-none uppercase text-xs tracking-wider font-sans">Email</span>
                    <span title={newCredentials.email} className="min-w-0 break-all font-bold text-gray-800">{newCredentials.email}</span>
                  </div>
                  <div className="bg-white px-4 py-3 rounded-lg border border-amber-100 shadow-sm grid gap-1 sm:grid-cols-[110px_minmax(0,1fr)] sm:items-center">
                    <span className="text-gray-400 select-none uppercase text-xs tracking-wider font-sans">New Password</span>
                    <span title={newCredentials.password} className="min-w-0 break-all font-bold text-gray-800">{newCredentials.password}</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => { setResetData(null); setNewCredentials(null); }}
                className="mt-2 w-full px-4 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
               >
                Copied / Close
              </button>
            </div>
          )}
        </div>
      </Modal>


    </div>
  );
}
