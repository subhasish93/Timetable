import { useEffect, useState, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Users, Upload, ClipboardList, ChevronRight, Loader2 } from 'lucide-react';
import { 
    getSections, createSection, updateSection, deleteSection, getTerms, getCourses,
    getSectionEnrollments, bulkEnrollSection, uploadEnrollSection, deleteEnrollment
} from '../api/api';
import toast from 'react-hot-toast';

export default function Sections() {
    const [sections, setSections] = useState([]);
    const [terms, setTerms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ term_id: '', name: '', max_capacity: 60 });
    const [saving, setSaving] = useState(false);

    const [showStudentsModal, setShowStudentsModal] = useState(false);
    const [selectedSection, setSelectedSection] = useState(null);
    const [enrollments, setEnrollments] = useState([]);
    const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('list');
    const [pasteText, setPasteText] = useState('');
    const [pasteProcessing, setPasteProcessing] = useState(false);
    const [uploadProcessing, setUploadProcessing] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [termsRes, coursesRes] = await Promise.all([
                getTerms(),
                getCourses()
            ]);

            const termsWithCourse = termsRes.data.map(t => {
                const course = coursesRes.data.find(c => c.id === t.course_id);
                return { ...t, course_name: course?.name || 'Unknown' };
            });
            setTerms(termsWithCourse);

            const allSections = [];
            for (const term of termsRes.data) {
                try {
                    const secsRes = await getSections(term.id);
                    const course = coursesRes.data.find(c => c.id === term.course_id);
                    allSections.push(...secsRes.data.map(s => ({ 
                        ...s, 
                        term_number: term.term_number,
                        term_id: term.id,
                        course_name: course?.name || 'Unknown',
                        display_name: `Semester ${term.term_number} - ${course?.name || 'Unknown'}`
                    })));
                } catch (e) {}
            }
            setSections(allSections);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = { name: form.name, max_capacity: parseInt(form.max_capacity) };
            if (editingId) {
                await updateSection(editingId, data);
                toast.success('Section updated');
            } else {
                await createSection(form.term_id, data);
                toast.success('Section created');
            }
            setShowModal(false);
            resetForm();
            loadData();
        } catch (err) {
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setForm({ term_id: '', name: '', max_capacity: 60 });
        setEditingId(null);
    };

    const handleEdit = (section) => {
        setForm({
            term_id: section.term_id,
            name: section.name,
            max_capacity: section.max_capacity
        });
        setEditingId(section.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this section?')) return;
        try {
            await deleteSection(id);
            toast.success('Section deleted');
            loadData();
        } catch (err) {
        }
    };

    const openStudentsModal = async (section) => {
        setSelectedSection(section);
        setEnrollments([]);
        setActiveTab('list');
        setPasteText('');
        setShowStudentsModal(true);
        await loadEnrollments(section.id);
    };

    const loadEnrollments = async (sectionId) => {
        setEnrollmentsLoading(true);
        try {
            const res = await getSectionEnrollments(sectionId);
            setEnrollments(res.data);
        } catch (err) {
        } finally {
            setEnrollmentsLoading(false);
        }
    };

    const handleRemoveEnrollment = async (enrollmentId) => {
        if (!confirm('Remove this student?')) return;
        try {
            await deleteEnrollment(enrollmentId);
            toast.success('Student removed');
            loadEnrollments(selectedSection.id);
        } catch (err) {
        }
    };

    const parseStudentIds = (text) => {
        if (!text) return [];
        const lines = text.split(/[\n,;\t]+/);
        return lines
            .map(line => line.trim())
            .filter(line => line.length > 0);
    };

    const handlePasteEnroll = async () => {
        const ids = parseStudentIds(pasteText);
        if (ids.length === 0) {
            toast.error('No student IDs found');
            return;
        }
        
        setPasteProcessing(true);
        try {
            const res = await bulkEnrollSection(selectedSection.id, ids);
            const { added, already_enrolled, skipped } = res.data;
            let msg = `${added} added`;
            if (already_enrolled > 0) msg += `, ${already_enrolled} already enrolled`;
            if (skipped > 0) msg += `, ${skipped} skipped (capacity)`;
            toast.success(msg);
            setPasteText('');
            loadEnrollments(selectedSection.id);
        } catch (err) {
        } finally {
            setPasteProcessing(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setUploadProcessing(true);
        try {
            const res = await uploadEnrollSection(selectedSection.id, file);
            const { total, added, already_enrolled, skipped } = res.data;
            let msg = `Processed ${total}: ${added} added`;
            if (already_enrolled > 0) msg += `, ${already_enrolled} already enrolled`;
            if (skipped > 0) msg += `, ${skipped} skipped (capacity)`;
            toast.success(msg);
            loadEnrollments(selectedSection.id);
        } catch (err) {
        } finally {
            setUploadProcessing(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Sections</h1>
                    <p className="text-sm text-gray-500 mt-1">Create class sections (A, B, C) for each semester</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-5 h-5" /> Add Section
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sections.map((section) => (
                            <tr key={section.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-gray-900">{section.display_name}</td>
                                <td className="px-6 py-4 text-gray-900 font-medium">Section {section.name}</td>
                                <td className="px-6 py-4 text-gray-600">{section.max_capacity} students</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs rounded-full ${section.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {section.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => openStudentsModal(section)} 
                                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                        title="Manage Students"
                                    >
                                        <Users className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleEdit(section)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(section.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg ml-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {sections.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                    No sections found. Create sections for each semester.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'Add'} Section</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                                <select 
                                    value={form.term_id} 
                                    onChange={(e) => setForm({ ...form, term_id: parseInt(e.target.value) })} 
                                    className="w-full px-4 py-2 border rounded-lg" 
                                    required
                                    disabled={editingId}
                                >
                                    <option value="">Select Semester</option>
                                    {terms.map(t => (
                                        <option key={t.id} value={t.id}>
                                            Semester {t.term_number} - {t.course_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Section Name</label>
                                    <select 
                                        value={form.name} 
                                        onChange={(e) => setForm({ ...form, name: e.target.value })} 
                                        className="w-full px-4 py-2 border rounded-lg" 
                                        required
                                    >
                                        <option value="">Select</option>
                                        {['A', 'B', 'C', 'D', 'E', 'F'].map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Capacity</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        value={form.max_capacity} 
                                        onChange={(e) => setForm({ ...form, max_capacity: e.target.value })} 
                                        className="w-full px-4 py-2 border rounded-lg" 
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showStudentsModal && selectedSection && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-semibold">Manage Students</h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Section {selectedSection.name} • {selectedSection.display_name} • 
                                    Enrolled: {enrollments.length} / {selectedSection.max_capacity}
                                </p>
                            </div>
                            <button onClick={() => setShowStudentsModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex border-b border-gray-100">
                            <button
                                onClick={() => setActiveTab('list')}
                                className={`flex items-center gap-1.5 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'list' 
                                        ? 'border-blue-600 text-blue-600' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Users className="w-4 h-4" />
                                Enrolled ({enrollments.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('paste')}
                                className={`flex items-center gap-1.5 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'paste' 
                                        ? 'border-blue-600 text-blue-600' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <ClipboardList className="w-4 h-4" />
                                Paste IDs
                            </button>
                            <button
                                onClick={() => setActiveTab('upload')}
                                className={`flex items-center gap-1.5 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'upload' 
                                        ? 'border-blue-600 text-blue-600' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Upload className="w-4 h-4" />
                                Upload Excel
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-6">
                            {activeTab === 'list' && (
                                <div>
                                    {enrollmentsLoading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                        </div>
                                    ) : enrollments.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                            <p className="text-gray-500">No students enrolled yet</p>
                                            <p className="text-sm text-gray-400 mt-1">Use "Paste IDs" or "Upload Excel" to add students</p>
                                        </div>
                                    ) : (
                                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                                            <table className="w-full">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {enrollments.map((e, idx) => (
                                                        <tr key={e.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 font-mono">{e.student_id}</td>
                                                            <td className="px-4 py-3 text-right">
                                                                <button 
                                                                    onClick={() => handleRemoveEnrollment(e.id)}
                                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'paste' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Paste Student IDs</label>
                                        <p className="text-xs text-gray-500 mb-2">
                                            Enter one ID per line, or separate with commas, semicolons, or tabs
                                        </p>
                                        <textarea
                                            value={pasteText}
                                            onChange={(e) => setPasteText(e.target.value)}
                                            placeholder="1001&#10;1002&#10;1003&#10;or: 1001, 1002, 1003"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                                            rows={8}
                                        />
                                    </div>
                                    {parseStudentIds(pasteText).length > 0 && (
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">{parseStudentIds(pasteText).length}</span> IDs detected
                                        </p>
                                    )}
                                    <button
                                        onClick={handlePasteEnroll}
                                        disabled={pasteProcessing || parseStudentIds(pasteText).length === 0}
                                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {pasteProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                                        <Plus className="w-4 h-4" />
                                        Enroll {parseStudentIds(pasteText).length > 0 ? `${parseStudentIds(pasteText).length} Students` : 'Students'}
                                    </button>
                                </div>
                            )}

                            {activeTab === 'upload' && (
                                <div className="space-y-6">
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                        <p className="text-sm font-medium text-gray-700 mb-1">Upload Excel File</p>
                                        <p className="text-xs text-gray-500 mb-4">
                                            Reads student IDs from the first column (.xlsx or .xls)
                                        </p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadProcessing}
                                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 mx-auto"
                                        >
                                            {uploadProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                                            <Upload className="w-4 h-4" />
                                            {uploadProcessing ? 'Processing...' : 'Select File'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 p-6 border-t border-gray-100">
                            <button 
                                onClick={() => setShowStudentsModal(false)} 
                                className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
