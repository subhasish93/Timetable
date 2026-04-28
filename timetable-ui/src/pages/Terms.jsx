import { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { getTerms, createTerm, deleteTerm, getCourses } from '../api/api';
import toast from 'react-hot-toast';

export default function Terms() {
    const [terms, setTerms] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ course_id: '', term_number: 1, start_date: '', end_date: '' });
    const [saving, setSaving] = useState(false);

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
            setCourses(coursesRes.data);
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
            const data = {
                term_number: form.term_number,
                term_type: 'SEMESTER',
                start_date: form.start_date,
                end_date: form.end_date
            };
            await createTerm(form.course_id, data);
            toast.success('Term created');
            setShowModal(false);
            setForm({ course_id: '', term_number: 1, start_date: '', end_date: '' });
            loadData();
        } catch (err) {
            // Error handled by interceptor
        } finally {
            setSaving(false);
        }
    };

    const calculateDates = (courseId, termNumber) => {
        if (!courseId || !termNumber) return;
        
        const currentYear = new Date().getFullYear();
        
        // Odd semesters: Aug-Dec, Even semesters: Jan-May
        const yearOffset = Math.floor((termNumber - 1) / 2);
        const isOddSemester = termNumber % 2 === 1;
        
        const year = currentYear + yearOffset;
        
        if (isOddSemester) {
            setForm({
                course_id: courseId,
                term_number: termNumber,
                start_date: `${year}-08-01`,
                end_date: `${year}-12-31`
            });
        } else {
            setForm({
                course_id: courseId,
                term_number: termNumber,
                start_date: `${year}-01-01`,
                end_date: `${year}-05-31`
            });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this term?')) return;
        try {
            await deleteTerm(id);
            toast.success('Term deleted');
            loadData();
        } catch (err) {
            // Error handled by interceptor
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
                    <h1 className="text-2xl font-bold text-gray-900">Semesters</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage semesters for your courses</p>
                </div>
                <button
                    onClick={() => {
                        const defaultCourse = courses[0]?.id || '';
                        if (defaultCourse) {
                            calculateDates(defaultCourse, 1);
                        } else {
            setForm({ course_id: '', term_number: 1, start_date: '', end_date: '' });
                        }
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-5 h-5" /> Add Term
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {terms.map((term) => (
                            <tr key={term.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-gray-900 font-medium">{term.course_name}</td>
                                <td className="px-6 py-4 text-gray-900">Semester {term.term_number}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">{term.term_type}</span>
                                </td>
                                <td className="px-6 py-4 text-gray-600 text-sm">
                                    {term.start_date} to {term.end_date}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs rounded-full ${term.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {term.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleDelete(term.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {terms.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                    No terms found. Create courses first, then add terms.
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
                            <h2 className="text-lg font-semibold">Add New Term</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                                <select 
                                    value={form.course_id} 
                                    onChange={(e) => {
                                        const courseId = parseInt(e.target.value);
                                        calculateDates(courseId, form.term_number);
                                    }} 
                                    className="w-full px-4 py-2 border rounded-lg" 
                                    required
                                >
                                    <option value="">Select Course</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.duration_years} years - {c.term_type})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                                    <select 
                                        value={form.term_number} 
                                        onChange={(e) => calculateDates(form.course_id, parseInt(e.target.value))} 
                                        className="w-full px-4 py-2 border rounded-lg"
                                        required
                                    >
                                        {Array.from({ length: 8 }, (_, i) => i + 1).map(n => (
                                            <option key={n} value={n}>Semester {n}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                                    <input 
                                        type="text" 
                                        value={form.start_date ? `${form.start_date} to ${form.end_date}` : ''} 
                                        className="w-full px-4 py-2 border rounded-lg bg-gray-50" 
                                        readOnly 
                                        placeholder="Auto-filled"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                    {saving ? 'Creating...' : 'Create Term'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
