import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000', // FastAPI URL
    headers: { 'Content-Type': 'application/json' },
});

// Global error handler
api.interceptors.response.use(
    res => res,
    err => {
        const msg = err.response?.data?.detail || 'Something went wrong';
        toast.error(msg);
        return Promise.reject(err);
    }
);

// ================= API FUNCTIONS =================

// Sections list
export const getSections = () => api.get('/sections');

// Time slots
export const getTimeSlots = () => api.get('/time-slots');

// Subject + Teacher dropdown
export const getSubjectTeachers = () => api.get('/subject-teachers-full');

// Timetable for a section
export const getSectionTimetable = (sectionId) =>
    api.get(`/timetable/section/${sectionId}`);

// Create timetable entry
export const createTimetable = (data) => api.post('/timetable', data);


// Delete timetable entry
export const deleteTimetable = (id) => api.delete(`/timetable/${id}`);

export default api;
