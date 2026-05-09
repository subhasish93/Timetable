import { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { getTerms, createTerm, deleteTerm, getCourses } from '../api/api';
import toast from 'react-hot-toast';

export default function Terms() {
    const [terms, setTerms] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ course_id: '', term_number: 1, term_type: 'SEMESTER', start_date: '', end_date: '' });
    const [saving, setSaving] = useState(false);
    const [filterCourse, setFilterCourse] = useState('');
    const [filterTermType, setFilterTermType] = useState('');

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
            setFilterCourse('');
            setFilterTermType('');
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
                term_type: form.term_type,
                start_date: form.start_date,
                end_date: form.end_date
            };
            await createTerm(form.course_id, data);
            toast.success('Term created');
            setShowModal(false);
            setForm({ course_id: '', term_number: 1, term_type: 'SEMESTER', start_date: '', end_date: '' });
            loadData();
        } catch (err) {
            // Error handled by interceptor
        } finally {
            setSaving(false);
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

    const filteredTerms = terms.filter(term => {
        if (filterCourse && term.course_id !== parseInt(filterCourse)) return false;
        if (filterTermType && term.term_type !== filterTermType) return false;
        return true;
    });

    const selectedCourse = courses.find(c => c.id === form.course_id);
    const maxTerms = selectedCourse
        ? selectedCourse.term_type === 'YEAR'
            ? selectedCourse.duration_years
            : selectedCourse.duration_years * 2
        : 8;
    const termLabel = form.term_type === 'YEAR' ? 'Year' : 'Semester';

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
                    <h1 className="text-2xl font-bold text-gray-900">Terms</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage terms for your courses</p>
                </div>
                <button
                    onClick={() => {
                        const defaultCourse = courses[0];
                        setForm({
                            course_id: defaultCourse?.id || '',
                            term_number: 1,
                            term_type: defaultCourse?.term_type || 'SEMESTER',
                            start_date: '',
                            end_date: ''
                        });
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-5 h-5" /> Add Term
                </button>
            </div>

            <div className="flex gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                    <select
                        value={filterCourse}
                        onChange={(e) => setFilterCourse(e.target.value)}
                        className="px-4 py-2 border rounded-lg"
                    >
                        <option value="">All Courses</option>
                        {courses.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Term Type</label>
                    <select
                        value={filterTermType}
                        onChange={(e) => setFilterTermType(e.target.value)}
                        className="px-4 py-2 border rounded-lg"
                    >
                        <option value="">All Types</option>
                        <option value="SEMESTER">SEMESTER</option>
                        <option value="YEAR">YEAR</option>
                    </select>
                </div>
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
                        {filteredTerms.map((term) => (
                            <tr key={term.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-gray-900 font-medium">{term.course_name}</td>
                                <td className="px-6 py-4 text-gray-900">{term.term_type === 'YEAR' ? 'Year' : 'Semester'} {term.term_number}</td>
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
                        {filteredTerms.length === 0 && (
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
                                        const course = courses.find(c => c.id === parseInt(e.target.value));
                                        setForm({
                                            ...form,
                                            course_id: parseInt(e.target.value),
                                            term_type: course?.term_type || 'SEMESTER',
                                            term_number: 1
                                        });
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{termLabel} Number</label>
                                <select 
                                    value={form.term_number} 
                                    onChange={(e) => setForm({ ...form, term_number: parseInt(e.target.value) })} 
                                    className="w-full px-4 py-2 border rounded-lg"
                                    required
                                >
                                    {Array.from({ length: maxTerms }, (_, i) => i + 1).map(n => (
                                        <option key={n} value={n}>{termLabel} {n}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input 
                                        type="date" 
                                        value={form.start_date} 
                                        onChange={(e) => setForm({ ...form, start_date: e.target.value })} 
                                        className="w-full px-4 py-2 border rounded-lg" 
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <input 
                                        type="date" 
                                        value={form.end_date} 
                                        onChange={(e) => setForm({ ...form, end_date: e.target.value })} 
                                        className="w-full px-4 py-2 border rounded-lg" 
                                        required
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
