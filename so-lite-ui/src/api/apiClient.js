// si quieres conectar con tu backend más adelante
import axios from "axios";
const api = axios.create({ baseURL: "http://localhost:3000/api" });
export default api;
