import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import InvestmentsPage from './pages/InvestmentsPage';
import IncomePage from './pages/IncomePage';
import ExpensesPage from './pages/ExpensesPage';
import AssetsPage from './pages/AssetsPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/investments" element={
          <ProtectedRoute>
            <InvestmentsPage />
          </ProtectedRoute>
        } />
        <Route path="/income" element={
          <ProtectedRoute>
            <IncomePage />
          </ProtectedRoute>
        } />
        <Route path="/expenses" element={
          <ProtectedRoute>
            <ExpensesPage />
          </ProtectedRoute>
        } />
        <Route path="/assets" element={
          <ProtectedRoute>
            <AssetsPage />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/investments" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;