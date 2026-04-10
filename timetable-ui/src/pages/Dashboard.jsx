import { useEffect, useState } from 'react';
import { BookOpen, Users, Calendar, DoorOpen, GraduationCap, BookMarked } from 'lucide-react';
import { getDashboardSummary } from '../api/api';

export default function Dashboard() {
    const [stats, setStats] = useState({
        courses: 0,
        terms: 0,
        subjects: 0,
        faculties: 0,
        rooms: 0,
        timetable_slots: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const res = await getDashboardSummary();
            setStats(res.data);
        } catch (err) {
            console.error('Failed to load stats', err);
        } finally {
            setLoading(false);
        }
    };

    const cards = [
        { label: 'Courses', value: stats.courses, icon: BookMarked, color: 'bg-blue-500' },
        { label: 'Terms', value: stats.terms, icon: Calendar, color: 'bg-purple-500' },
        { label: 'Subjects', value: stats.subjects, icon: BookOpen, color: 'bg-green-500' },
        { label: 'Faculties', value: stats.faculties, icon: GraduationCap, color: 'bg-orange-500' },
        { label: 'Rooms', value: stats.rooms, icon: DoorOpen, color: 'bg-teal-500' },
        { label: 'Timetable Slots', value: stats.timetable_slots, icon: Users, color: 'bg-pink-500' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => (
                    <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                            </div>
                            <div className={`${card.color} p-3 rounded-lg`}>
                                <card.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Start Guide</h2>
                <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                        <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">1</span>
                        <div>
                            <h3 className="font-medium text-gray-900">Create Departments</h3>
                            <p className="text-sm text-gray-500">Start by adding departments under your organization</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                        <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">2</span>
                        <div>
                            <h3 className="font-medium text-gray-900">Add Courses & Terms</h3>
                            <p className="text-sm text-gray-500">Define courses with their semesters/years</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                        <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">3</span>
                        <div>
                            <h3 className="font-medium text-gray-900">Configure Subjects & Sections</h3>
                            <p className="text-sm text-gray-500">Add subjects and create sections for each term</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                        <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">4</span>
                        <div>
                            <h3 className="font-medium text-gray-900">Add Faculty & Rooms</h3>
                            <p className="text-sm text-gray-500">Register faculties and define available rooms</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                        <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">5</span>
                        <div>
                            <h3 className="font-medium text-gray-900">Build Timetable</h3>
                            <p className="text-sm text-gray-500">Assign faculty and create schedule slots</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
