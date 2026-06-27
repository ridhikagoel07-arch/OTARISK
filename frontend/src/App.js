import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import LiveTransactions from "@/pages/LiveTransactions";
import Pipelines from "@/pages/Pipelines";
import FraudAnalysis from "@/pages/FraudAnalysis";
import Settings from "@/pages/Settings";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/stream" element={<LiveTransactions />} />
            <Route path="/pipelines" element={<Pipelines />} />
            <Route path="/analysis/:txId" element={<FraudAnalysis />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
