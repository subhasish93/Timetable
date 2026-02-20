import { API } from "./api";

export const getSections = () => API.get("/sections");
export const getSlots = () => API.get("/time-slots");
export const getSubjectTeachers = () => API.get("/subject-teachers");

export const createTimetable = (data) => API.post("/timetable", data);
export const updateTimetable = (id, data) => API.put(`/timetable/${id}`, data);
export const deleteTimetable = (id) => API.delete(`/timetable/${id}`);
export const getFullTimetable = () => API.get("/timetable/full");
export const getSectionTimetable = (sectionId) =>
    API.get(`/timetable/section/${sectionId}`);
