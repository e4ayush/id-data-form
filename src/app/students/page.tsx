"use client";

import { useState, useEffect, useMemo } from "react";
import { API_URL } from "@/lib/api";

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";

const adminHeaders = {
  "Content-Type": "application/json",
  "X-Admin-Secret": ADMIN_SECRET,
};

export default function StudentsPage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [activeSchool, setActiveSchool] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedClass, setSelectedClass] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [fullSizeImage, setFullSizeImage] = useState<string | null>(null);
  const [editStudent, setEditStudent] = useState<any | null>(null);
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // New Student States
  const [showCreate, setShowCreate] = useState(false);
  const [newStudent, setNewStudent] = useState<Record<string, string>>({ name: "" });
  const [isCreating, setIsCreating] = useState(false);

  // Refresh/Sync States
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Error feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const res = await fetch(`${API_URL}/schools`, { headers: adminHeaders });
      const result = await res.json();
      setSchools(result.data || []);
      const savedSchool = localStorage.getItem("bizeraActiveSchool");
      if (savedSchool) {
        const parsed = JSON.parse(savedSchool);
        setActiveSchool(parsed);
        fetchStudents(parsed.id);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Failed to fetch schools", error);
      setIsLoading(false);
    }
  };

  const fetchStudents = async (schoolId: string) => {
    setIsLoading(true);
    setIsRefreshing(true);
    try {
      const res = await fetch(`${API_URL}/students/${schoolId}`, { headers: adminHeaders });
      const result = await res.json();
      setStudents(result.data || []);
      setSelectedClass("All");
      setSearchQuery("");
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Failed to fetch students", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !activeSchool) return;
    setIsCreating(true);
    try {
      const res = await fetch(`${API_URL}/student`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ ...newStudent, school_id: activeSchool.id, custom_data: {} }),
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.detail || "Failed to create student.");
      }
      fetchStudents(activeSchool.id);
      setShowCreate(false);
      setNewStudent({ name: "" });
    } catch (error: any) {
      setErrorMsg(error.message || "Create failed. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSchoolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const schoolId = e.target.value;
    const school = schools.find((s) => s.id === schoolId);
    if (school) {
      setActiveSchool(school);
      localStorage.setItem("bizeraActiveSchool", JSON.stringify(school));
      fetchStudents(schoolId);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_URL}/student/${id}`, {
        method: "DELETE",
        headers: adminHeaders,
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.detail || "Delete failed on the server.");
      }
      setStudents(students.filter((s) => s.id !== id));
    } catch (error: any) {
      setErrorMsg(error.message || "Delete failed. Please try again.");
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;
    setIsSaving(true);
    try {
      if (newPhotoFile) {
        const formData = new FormData();
        formData.append("file", newPhotoFile);
        await fetch(`${API_URL}/upload-photo/${editStudent.id}`, {
          method: "POST",
          headers: { "X-Admin-Secret": ADMIN_SECRET },
          body: formData,
        });
      }
      const updateData: any = {
        name: editStudent.name,
        class: editStudent.class,
        section: editStudent.section,
        roll_number: editStudent.roll_number,
        custom_data: editStudent.custom_data,
      };
      if (editStudent.photo_url === null && !newPhotoFile) {
        updateData.photo_url = null;
      }
      await fetch(`${API_URL}/student/${editStudent.id}`, {
        method: "PUT",
        headers: adminHeaders,
        body: JSON.stringify(updateData),
      });
      fetchStudents(activeSchool.id);
      setEditStudent(null);
      setNewPhotoFile(null);
    } catch (error: any) {
      setErrorMsg(error.message || "Save failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const availableClasses = useMemo(
    () =>
      Array.from(new Set(students.map((s) => s.class)))
        .filter(Boolean)
        .sort(),
    [students]
  );

  // Derive the schema for the "New Student" form from existing students.
  // Core fields that actually appear with a value in ANY student are shown.
  // Custom fields present in ANY student's custom_data are also shown.
  const createFormFields = useMemo(() => {
    const CORE_FIELDS = [
      { key: "class", label: "Class" },
      { key: "section", label: "Section" },
      { key: "roll_number", label: "Roll No" },
      { key: "admission_number", label: "Admission No" },
      { key: "dob", label: "Date of Birth" },
      { key: "fathers_name", label: "Father's Name" },
      { key: "mothers_name", label: "Mother's Name" },
      { key: "blood_group", label: "Blood Group" },
      { key: "phone", label: "Phone" },
      { key: "aadhar_number", label: "Aadhar No" },
      { key: "address", label: "Address" },
      { key: "house", label: "House" },
      { key: "height", label: "Height" },
      { key: "weight", label: "Weight" },
    ];

    if (students.length === 0) {
      // No data yet — show a minimal sensible set
      return [
        { key: "class", label: "Class" },
        { key: "section", label: "Section" },
        { key: "roll_number", label: "Roll No" },
        { key: "admission_number", label: "Admission No" },
      ];
    }

    // Which core fields have at least one non-empty value?
    const usedCore = CORE_FIELDS.filter((f) =>
      students.some((s) => s[f.key] != null && s[f.key] !== "")
    );

    // Which custom_data keys appear in at least one student?
    const customKeys = new Set<string>();
    students.forEach((s) => {
      Object.keys(s.custom_data || {}).forEach((k) => customKeys.add(k));
    });
    const usedCustom = Array.from(customKeys).map((k) => ({ key: `custom_${k}`, label: k, isCustom: true }));

    return [...usedCore, ...usedCustom];
  }, [students]);

  const filteredStudents = useMemo(() => {
    let list = selectedClass === "All" ? students : students.filter((s) => s.class === selectedClass);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.roll_number?.toLowerCase().includes(q) ||
          s.admission_number?.toLowerCase().includes(q) ||
          s.section?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [students, selectedClass, searchQuery]);

  const classBreakdown = useMemo(() => {
    return availableClasses.map((cls) => ({
      cls,
      count: students.filter((s) => s.class === cls).length,
    }));
  }, [students, availableClasses]);

  const withPhotos = students.filter((s) => s.photo_url).length;

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Loading directory...</p>
        </div>
      </div>
    );

  return (
    <div className="p-8 max-w-7xl mx-auto">

      {/* ── Error Banner ── */}
      {errorMsg && (
        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 text-sm font-medium px-4 py-3 rounded-xl">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="flex-1">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600 text-lg leading-none shrink-0">&times;</button>
        </div>
      )}

      {/* ── Top Bar ── */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Student Directory</h2>
          {activeSchool && (
            <div className="flex flex-col gap-1">
              <p className="text-sm text-gray-400 mt-0.5">
                {activeSchool.name} &mdash; {students.length} records
              </p>
              <div className="flex items-center gap-3">
                {lastRefreshed && (
                  <span className="text-xs text-gray-400">
                    Last synced: {lastRefreshed.toLocaleTimeString()}
                  </span>
                )}
                <button
                  onClick={() => fetchStudents(activeSchool.id)}
                  disabled={isRefreshing}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-700 disabled:opacity-40 transition-colors"
                >
                  <svg className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {isRefreshing ? "Syncing..." : "Refresh"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* School picker */}
        <select
          value={activeSchool?.id || ""}
          onChange={handleSchoolChange}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm min-w-[220px]"
        >
          <option value="" disabled>Select a school</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {!activeSchool ? (
        /* ── Empty state ── */
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 text-3xl">🏫</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No school selected</h3>
          <p className="text-sm text-gray-400">Pick a school from the dropdown above to view its students.</p>
        </div>
      ) : (
        <>
          {/* ── Stats Row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Students" value={students.length} color="indigo" />
            <StatCard label="Classes" value={availableClasses.length} color="violet" />
            <StatCard label="Photos Uploaded" value={withPhotos} color="emerald" />
            <StatCard label="Missing Photos" value={students.length - withPhotos} color="amber" />
          </div>

          {/* ── Filters Row ── */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 mb-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center">

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, roll no, admission no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
                >
                  ×
                </button>
              )}
            </div>

            {/* Class filter pills */}
            <div className="flex gap-2 flex-wrap">
              <FilterPill label="All" active={selectedClass === "All"} onClick={() => setSelectedClass("All")} count={students.length} />
              {classBreakdown.map(({ cls, count }) => (
                <FilterPill
                  key={cls as string}
                  label={`Class ${cls}`}
                  active={selectedClass === cls}
                  onClick={() => setSelectedClass(cls as string)}
                  count={count}
                />
              ))}
            </div>

            {/* Results count & Actions */}
            <div className="ml-auto flex items-center gap-4">
              <div className="shrink-0 text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg whitespace-nowrap">
                {filteredStudents.length} result{filteredStudents.length !== 1 ? "s" : ""}
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
              >
                <span className="text-base leading-none">+</span> New Student
              </button>
            </div>
          </div>

          {/* ── Table ── */}
          {filteredStudents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
              <p className="text-gray-400 text-sm">No students match your search.</p>
              <button
                onClick={() => { setSearchQuery(""); setSelectedClass("All"); }}
                className="mt-3 text-indigo-500 text-sm font-medium hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-14">Photo</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Name</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Class</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Roll No</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Adm. No</th>
                      <th className="px-5 py-3.5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50/60 transition-colors group">
                        <td className="px-5 py-3.5">
                          {student.photo_url ? (
                            <img
                              src={student.photo_url}
                              onClick={() => setFullSizeImage(student.photo_url)}
                              className="w-9 h-9 rounded-lg object-cover cursor-pointer ring-1 ring-gray-200 hover:ring-indigo-300 transition-all"
                              alt={student.name}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-400 text-xs font-bold select-none">
                              {student.name?.charAt(0)?.toUpperCase() ?? "?"}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-gray-900">{student.name}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-semibold border border-indigo-100">
                              {student.class}
                            </span>
                            {student.section && (
                              <span className="text-gray-400 text-xs font-medium">{student.section}</span>
                            )}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 font-mono text-xs">
                          {student.roll_number || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 font-mono text-xs">
                          {student.admission_number || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setEditStudent({ ...student })}
                              className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(student.id, student.name)}
                              className="px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Create Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900">Add New Student</h3>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 text-xl leading-none">×</button>
            </div>
            <div className="overflow-y-auto max-h-[60vh] p-6">
              <form id="createForm" onSubmit={handleCreateStudent} className="space-y-3">
                {/* Name — always required */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.name || ""}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  />
                </div>

                {/* Dynamically derived fields — only fields this school actually uses */}
                {createFormFields.map(({ key, label, isCustom }: any) => {
                  const stateKey = isCustom ? key : key;
                  return (
                    <div key={key}>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</label>
                      <input
                        type="text"
                        value={newStudent[stateKey] || ""}
                        onChange={(e) => setNewStudent({ ...newStudent, [stateKey]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                      />
                    </div>
                  );
                })}
              </form>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl font-medium text-sm transition-colors">Cancel</button>
              <button form="createForm" type="submit" disabled={isCreating} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50">
                {isCreating ? "Adding..." : "Add Student"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-gray-900">Edit Student</h3>
                <p className="text-xs text-gray-400 mt-0.5">{editStudent.name}</p>
              </div>
              <button
                onClick={() => { setEditStudent(null); setNewPhotoFile(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 text-xl leading-none transition-colors"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              <form id="editForm" onSubmit={handleSaveEdit} className="space-y-5">

                {/* Photo ... (omitted for brevity in replacement, but kept in actual file) */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  {newPhotoFile || editStudent.photo_url ? (
                    <img
                      src={newPhotoFile ? URL.createObjectURL(newPhotoFile) : editStudent.photo_url}
                      className="w-16 h-16 rounded-xl object-cover ring-1 ring-gray-200"
                      alt="Preview"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-300 text-xl font-bold">
                      {editStudent.name?.charAt(0) ?? "?"}
                    </div>
                  )}
                  <div className="flex-1 space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Student Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewPhotoFile(e.target.files?.[0] || null)}
                      className="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                    {(editStudent.photo_url || newPhotoFile) && (
                      <button
                        type="button"
                        onClick={() => { setEditStudent({ ...editStudent, photo_url: null }); setNewPhotoFile(null); }}
                        className="text-xs text-red-500 font-semibold hover:text-red-700"
                      >
                        Remove photo
                      </button>
                    )}
                  </div>
                </div>

                {/* Core fields — only render if they have a value */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editStudent.name || ""}
                      onChange={(e) => setEditStudent({ ...editStudent, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    />
                  </div>
                  {/* Only show these if they exist on the student */}
                  {[
                    { key: "class", label: "Class" },
                    { key: "section", label: "Section" },
                    { key: "roll_number", label: "Roll No" },
                    { key: "admission_number", label: "Adm. No" },
                  ]
                    .filter(({ key }) => editStudent[key] != null && editStudent[key] !== "")
                    .map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</label>
                        <input
                          type="text"
                          value={editStudent[key] || ""}
                          onChange={(e) => setEditStudent({ ...editStudent, [key]: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                        />
                      </div>
                    ))}
                </div>

                {/* Custom fields */}
                {Object.keys(editStudent.custom_data || {}).length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Additional Fields</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(editStudent.custom_data).map(([key, value]) => (
                        <div key={key}>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{key}</label>
                          <input
                            type="text"
                            value={(value as string) || ""}
                            onChange={(e) => {
                              const newCustom = { ...editStudent.custom_data, [key]: e.target.value };
                              setEditStudent({ ...editStudent, custom_data: newCustom });
                            }}
                            className="w-full px-3 py-2 border border-gray-100 bg-gray-50 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                type="button"
                onClick={() => { setEditStudent(null); setNewPhotoFile(null); }}
                className="flex-1 px-4 py-2.5 text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                form="editForm"
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      {fullSizeImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 cursor-zoom-out"
          onClick={() => setFullSizeImage(null)}
        >
          <img src={fullSizeImage} className="max-w-full max-h-full rounded-xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">{label}</p>
      <p className="text-3xl font-black">{value}</p>
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border flex items-center gap-1.5 ${
        active
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
      }`}
    >
      {label}
      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${active ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-400"}`}>
        {count}
      </span>
    </button>
  );
}