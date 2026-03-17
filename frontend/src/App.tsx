import { BrowserRouter, Routes, Route } from "react-router-dom"
import Layout from "./components/Layout"
import AuthGuard from "./components/AuthGuard"
import HomePage from "./pages/HomePage"
import LoginPage from "./pages/LoginPage"
import DashboardPage from "./pages/DashboardPage"
import TaskListPage from "./pages/TaskListPage"
import SubmitPage from "./pages/SubmitPage"
import PolicyPage from "./pages/PolicyPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected pages (require login) */}
        <Route element={<AuthGuard />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tasks" element={<TaskListPage />} />
            <Route path="/submit" element={<SubmitPage />} />
            <Route path="/policies" element={<PolicyPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
