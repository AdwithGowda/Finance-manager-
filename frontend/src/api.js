// src/api.js
import api from "./utils/api"; // ✅ use the authenticated axios instance

export const fetchExpenses = () => api.get("/expenses");

export const createExpense = (data) => api.post("/expenses", data);

export const updateExpense = (id, data) =>
  api.put(`/expenses/${id}`, data);

export const deleteExpense = (id) =>
  api.delete(`/expenses/${id}`);
