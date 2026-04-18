"use client";

import { useState, useEffect, useRef } from "react";
import { API_URL } from "@/lib/api";

export default function Home() {
  const [schoolName, setSchoolName] = useState("");
  const [activeSchool, setActiveSchool] = useState<{ id: string; name: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{email: string, password: string} | null>(null);

  // State to hold our list of existing schools
  const [existingSchools, setExistingSchools] = useState<{ id: string; name: string }[]>([]);

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Active School AND Fetch Existing Schools on mount
  useEffect(() => {
    const savedSchool = localStorage.getItem("bizeraActiveSchool");
    if (savedSchool) {
      setActiveSchool(JSON.parse(savedSchool));
    }
    fetchSchools();
  }, []);

  // Function to fetch schools from FastAPI
  const fetchSchools = async () => {
    try {
      const res = await fetch(`${API_URL}/schools`, {
        headers: { "X-Admin-Secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || "" }
      });
      const result = await res.json();
      setExistingSchools(result.data || []);
    } catch (error) {
      console.error("Failed to fetch schools", error);
    }
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName) return;
    
    setIsCreating(true);
    setNewCredentials(null); // Clear old credentials
    
    try {
      const res = await fetch(`${API_URL}/create-school`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || ""
        },
        body: JSON.stringify({ name: schoolName }),
      });
      const result = await res.json();
      
      setActiveSchool(result.data);
      localStorage.setItem("bizeraActiveSchool", JSON.stringify(result.data));
      setSchoolName("");
      
      // NEW: Save the credentials from the backend!
      if (result.credentials) {
        setNewCredentials(result.credentials);
      }
      
      fetchSchools();
    } catch (error) {
      console.error("Error creating school:", error);
    }
    setIsCreating(false);
  };

  // Function to handle selecting an existing school
  const handleSelectSchool = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) return;
    
    const school = existingSchools.find(s => s.id === selectedId);
    if (school) {
      setActiveSchool(school);
      localStorage.setItem("bizeraActiveSchool", JSON.stringify(school));
    }
  };

  const clearActiveSchool = () => {
    setActiveSchool(null);
    localStorage.removeItem("bizeraActiveSchool");
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !activeSchool) return;

    setIsUploading(true);
    setUploadMessage("Uploading and parsing data...");
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/upload-excel/${activeSchool.id}`, {
        method: "POST",
        headers: { "X-Admin-Secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || "" },
        body: formData, 
      });
      const result = await res.json();
      setUploadMessage(result.message || "Upload successful!");
      setFile(null); 
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setUploadMessage("Upload failed. Check console.");
      console.error(error);
    }
    setIsUploading(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Manage Schools</h2>
        <p className="text-gray-500 mt-1">Create new schools and upload student data directly to the database.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Register & Select School */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6">
            
            {/* Active School Badge */}
            {activeSchool && (
              <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100 flex justify-between items-center">
                <span><span className="font-bold">Active:</span> {activeSchool.name}</span>
                <button onClick={clearActiveSchool} className="text-green-800 hover:text-green-900 font-semibold underline text-xs">
                  Clear
                </button>
              </div>
            )}

            {/* Select Existing School Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Select Existing School</label>
              <select 
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm text-gray-700"
                onChange={handleSelectSchool}
                value={activeSchool?.id || ""}
              >
                <option value="" disabled>-- Choose a school --</option>
                {existingSchools.map((school) => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <div className="grow border-t border-gray-200"></div>
              <span className="px-3 text-xs text-gray-400 font-medium">OR</span>
              <div className="grow border-t border-gray-200"></div>
            </div>

            {/* Create School Form */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Register New School</label>
              <form onSubmit={handleCreateSchool} className="space-y-3">
                <input 
                  type="text" 
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                  placeholder="e.g., Delhi Public School"
                />
                <button 
                  type="submit" 
                  disabled={isCreating || !schoolName}
                  className="w-full bg-indigo-600 text-white font-medium py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm"
                >
                  {isCreating ? "Registering..." : "Create School"}
                </button>
              </form>

              {/* The Credentials Alert Box */}
              {newCredentials && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <h4 className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
                    ⚠️ Save these credentials!
                  </h4>
                  <p className="text-xs text-amber-700 mb-3">
                    Give these to the school. They will use this to log into the Flutter app. You cannot see this password again once you close this page.
                  </p>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="bg-white px-3 py-2 rounded border border-amber-100 text-gray-800 flex justify-between">
                      <span className="text-gray-400 select-none">Email:</span> 
                      <span className="font-bold">{newCredentials.email}</span>
                    </div>
                    <div className="bg-white px-3 py-2 rounded border border-amber-100 text-gray-800 flex justify-between">
                      <span className="text-gray-400 select-none">Password:</span> 
                      <span className="font-bold">{newCredentials.password}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right Column: Upload Excel */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">2. Upload Data</h3>
            
            {!activeSchool ? (
              <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center text-sm text-gray-400 h-48 flex items-center justify-center bg-gray-50">
                Please select or register a school first to unlock uploading.
              </div>
            ) : (
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div className="p-8 border-2 border-dashed border-indigo-200 rounded-xl text-center hover:bg-indigo-50 transition-colors">
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".xlsx, .xls"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={isUploading || !file}
                  className="w-full bg-gray-900 text-white font-medium py-2.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {isUploading ? "Processing..." : "Upload Excel Sheet"}
                </button>

                {uploadMessage && (
                  <p className="text-sm text-center font-medium text-indigo-600 mt-2">{uploadMessage}</p>
                )}
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}