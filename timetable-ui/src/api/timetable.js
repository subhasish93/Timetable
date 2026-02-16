import { API } from "./api";

export const getSections = () => API.get("/sections");
export const getSlots = () => API.get("/time-slots");
export const createTimetable = (data) => API.post("/timetable", data);
export const getFullTimetable = () => API.get("/timetable/full");
