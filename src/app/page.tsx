"use client";

import { useState, useEffect, useRef } from "react";
import { API_URL } from "@/lib/api";
import { Modal } from "@/components/Modal";

export default function Home() {
  const [schoolName, setSchoolName] = useState("");
  const [activeSchool, setActiveSchool] = useState<{ id: string; name: string } | null>(null);
  
  // Existing schools state
  const [existingSchools, setExistingSchools] = useState<{ id: string; name: string }[]>([]);

  // Modal States
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{email: string, password: string} | null>(null);

  // Upload States
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState({ text: "", type: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedSchool = localStorage.getItem("bizeraActiveSchool");
    if (savedSchool) {
      setActiveSchool(JSON.parse(savedSchool));
    }
    fetchSchools();
  }, []);

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
    setNewCredentials(null);
    
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
      
      if (!res.ok) {
        alert(result.detail || "Failed to create school.");
        setIsCreating(false);
        return;
      }

      setActiveSchool(result.data);
      localStorage.setItem("bizeraActiveSchool", JSON.stringify(result.data));
      setSchoolName("");
      
      if (result.credentials) {
        setNewCredentials(result.credentials);
      }
      
      fetchSchools();
    } catch (error) {
      console.error("Error creating school:", error);
      alert("Error creating school. Please check console.");
    }
    setIsCreating(false);
  };

  const handleSelectSchool = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      clearActiveSchool();
      return;
    }
    
    const school = existingSchools.find(s => s.id === selectedId);
    if (school) {
      setActiveSchool(school);
      localStorage.setItem("bizeraActiveSchool", JSON.stringify(school));
    }
  };

  const clearActiveSchool = () => {
    setActiveSchool(null);
    localStorage.removeItem("bizeraActiveSchool");
    setUploadMessage({ text: "", type: "" });
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !activeSchool) return;

    setIsUploading(true);
    setUploadMessage({ text: "Uploading and parsing data...", type: "loading" });
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/upload-excel/${activeSchool.id}`, {
        method: "POST",
        headers: { "X-Admin-Secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || "" },
        body: formData, 
      });
      const result = await res.json();
      
      if (res.ok) {
        setUploadMessage({ text: result.message || "Upload successful!", type: "success" });
        setFile(null); 
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setUploadMessage({ text: result.detail || "Upload failed.", type: "error" });
      }
    } catch (error) {
      setUploadMessage({ text: "Upload failed. Check console.", type: "error" });
      console.error(error);
    }
    setIsUploading(false);
  };

  // Resets modal state when closed
  const closeRegisterModal = () => {
    setIsRegisterModalOpen(false);
    setNewCredentials(null);
    setSchoolName("");
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <header className="mb-10 text-center">
        <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Data Injection</h2>
        <p className="text-gray-500 mt-3 text-lg max-w-xl mx-auto">
          Securely register new branches and seamlessly import student datasets into the cloud.
        </p>
      </header>

      {/* STEP 1: School Selection */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-10 mb-8 transition-all hover:shadow-md">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-lg">
            1
          </div>
          <h3 className="text-2xl font-bold text-gray-800">Target School</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative">
          
          <div className="md:col-span-7 flex flex-col justify-center">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Active Workspace</label>
            <select 
              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none text-base text-gray-800 font-medium transition-all appearance-none cursor-pointer"
              onChange={handleSelectSchool}
              value={activeSchool?.id || ""}
              style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="none" viewBox="0 0 24 24" stroke="gray" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em' }}
            >
              <option value="">-- Choose a school --</option>
              {existingSchools.map((school) => (
                <option key={school.id} value={school.id}>{school.name}</option>
              ))}
            </select>
          </div>

          <div className="hidden md:flex md:col-span-1 items-center justify-center">
            <div className="h-full w-px bg-gray-200"></div>
          </div>

          <div className="md:col-span-4 flex flex-col justify-center items-start">
            <p className="text-sm text-gray-500 mb-3 font-medium">Don't see your school?</p>
            <button 
              onClick={() => setIsRegisterModalOpen(true)}
              className="w-full sm:w-auto bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 group border border-indigo-100 hover:border-indigo-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:scale-110" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Register New 
            </button>
          </div>
        </div>
      </div>

      {/* STEP 2: Data Upload (Fades out when no school selected) */}
      <div className={`bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-10 transition-all hover:shadow-md ${!activeSchool ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-lg">
            2
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Upload Dataset</h3>
            <p className="text-sm text-indigo-600 font-medium mt-1">
              {activeSchool ? `Injecting into: ${activeSchool.name}` : "Awaiting Target School"}
            </p>
          </div>
        </div>

        <form onSubmit={handleFileUpload} className="space-y-6 max-w-2xl mx-auto">
          
          <div className="relative group">
            <div className={`absolute -inset-1 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 ${file ? 'bg-indigo-400' : 'bg-gray-300'}`}></div>
            <div className={`relative px-8 py-16 bg-white border-2 border-dashed rounded-2xl text-center transition-colors flex flex-col items-center justify-center ${file ? 'border-indigo-400 bg-indigo-50/50' : 'border-gray-300 hover:border-gray-400'}`}>
              
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 mb-4 ${file ? 'text-indigo-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              
              <p className="text-base text-gray-600 mb-2 font-medium">
                {file ? file.name : "Drag and drop your Excel sheet here"}
              </p>
              <p className="text-xs text-gray-400 mb-6">
                Supports .xlsx or .csv
              </p>
              
              <label className="cursor-pointer bg-gray-900 text-white hover:bg-gray-800 px-6 py-2.5 rounded-full font-medium text-sm transition-colors shadow-sm inline-block">
                Browse Files
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={isUploading || !file}
            className="w-full bg-indigo-600 focus:ring-4 focus:ring-indigo-300 text-white font-bold text-lg py-4 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-lg hover:shadow-xl"
          >
            {isUploading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : "Inject Data"}
          </button>

          {uploadMessage.text && (
            <div className={`p-4 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold ${
              uploadMessage.type === 'success' ? 'bg-green-50 text-green-700 ring-1 ring-green-200' :
              uploadMessage.type === 'error' ? 'bg-red-50 text-red-700 ring-1 ring-red-200' :
              'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
            }`}>
              {uploadMessage.type === 'success' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
              {uploadMessage.type === 'error' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
              {uploadMessage.text}
            </div>
          )}
        </form>
      </div>

      {/* Modal for Creating Schools */}
      <Modal 
        isOpen={isRegisterModalOpen} 
        onClose={closeRegisterModal} 
        title="Register New School"
        maxWidth="md"
      >
        {!newCredentials ? (
          <form onSubmit={handleCreateSchool} className="space-y-5 py-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Official School Name</label>
              <input 
                type="text" 
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                placeholder="e.g., Delhi Public School"
                autoFocus
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={closeRegisterModal}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isCreating || !schoolName}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex justify-center items-center"
              >
                {isCreating ? "Registering..." : "Create"}
              </button>
            </div>
          </form>
        ) : (
          <div className="py-2 flex flex-col gap-5">
            <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <div className="text-center">
              <h4 className="text-xl font-bold text-gray-900 mb-1">Registration Complete!</h4>
              <p className="text-sm text-gray-500">
                The school has been bound to the system and selected as active.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mt-2">
              <p className="text-sm text-amber-800 mb-4 font-medium flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                Copy these credentials now! They will not be shown again.
              </p>
              
              <div className="space-y-3 font-mono text-sm">
                <div className="bg-white px-4 py-3 rounded-lg border border-amber-100 shadow-sm flex items-center justify-between">
                  <span className="text-gray-400 select-none font-sans text-xs uppercase tracking-wider">Email</span> 
                  <span className="font-bold text-gray-800">{newCredentials.email}</span>
                </div>
                <div className="bg-white px-4 py-3 rounded-lg border border-amber-100 shadow-sm flex items-center justify-between">
                  <span className="text-gray-400 select-none font-sans text-xs uppercase tracking-wider">Password</span> 
                  <span className="font-bold text-gray-800">{newCredentials.password}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={closeRegisterModal}
              className="mt-2 w-full px-4 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
            >
              I have saved them. Proceed.
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}