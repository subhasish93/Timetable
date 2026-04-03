import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000', // FastAPI URL
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
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

// Time slots
export const getTimeSlots = () => api.get('/time-slots');

// Subject + Teacher dropdown (with optional filters)
export const getSubjectTeachers = (params) => api.get('/subject-teachers-full', { params });

// Timetable for department + section
export const getDeptSectionTimetable = (departmentId, section) =>
    api.get('/timetable/department-section', { params: { department_id: departmentId, section } });

// Create timetable entry
export const createTimetable = (data) => api.post('/timetable', data);


// Delete timetable entry
export const deleteTimetable = (id) => api.delete(`/timetable/${id}`);
export const updateTimetable = (id, data) => api.put(`/timetable/${id}`, data);

export default api;

// ================= DEPARTMENT APIs =================

// Get all departments
export const getDepartments = () => api.get('/department');

// Create department
export const createDepartment = (data) => api.post('/department', data);

// Delete department
export const deleteDepartment = (id) => api.delete(`/department/${id}`);

// Update department
export const updateDepartment = (id, data) =>
    api.put(`/department/${id}`, data);

// ================= COURSE APIs =================

export const getCourses = () => api.get('/course');
export const createCourse = (data) => api.post('/course', data);

// ================= TEACHER APIs =================

export const getTeachers = (params) => api.get('/teachers', { params });
export const createTeacher = (data) => api.post('/teacher', data);

// ================= SUBJECT APIs =================

export const getSubjects = (params) => api.get('/subjects', { params });
export const createSubject = (data) => api.post('/subject', data);
