import { Navigate, Outlet } from "react-router-dom"

export default function AuthGuard() {
  const isAuthed = sessionStorage.getItem("auth") === "1"
  return isAuthed ? <Outlet /> : <Navigate to="/login" replace />
}
