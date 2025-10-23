import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import MyPage from "./pages/MyPage.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import HomePage from "./pages/HomePage.jsx";
import ServiceSearchPage from "./pages/ServiceSearchPage.jsx";
import SubscriptionListPage from "./pages/SubscriptionListPage.jsx";
import ComparisonPage from "./pages/ComparisonPage.jsx";
import ServiceDetailPage from "./pages/ServiceDetailPage.jsx";
import PromotionsPage from "./pages/PromotionsPage.jsx";
import BundlesPage from "./pages/BundlesPage.jsx";
import Header from "./components/Header.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/mypage"
          element={
            <RequireAuth>
              <MyPage />
            </RequireAuth>
          }
        />
        <Route path="/search" element={<ServiceSearchPage />} />
        <Route
          path="/subscriptions"
          element={
            <RequireAuth>
              <SubscriptionListPage />
            </RequireAuth>
          }
        />
        <Route path="/compare" element={<ComparisonPage />} />
        <Route path="/services/:id" element={<ServiceDetailPage />} />
        <Route path="/categories/:slug" element={<CategoryPage />} />
        <Route path="/promotions" element={<PromotionsPage />} />
        <Route path="/bundles" element={<BundlesPage />} />
        <Route path="*" element={<h3>404 - 페이지를 찾을 수 없습니다</h3>} />
      </Routes>
    </div>
  );
}

export default App;