import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import MyPage from "./pages/MyPage";
import SubscriptionListPage from "./pages/SubscriptionListPage";
import ServiceSearchPage from "./pages/ServiceSearchPage";
import ServiceDetailPage from "./pages/ServiceDetailPage";
import ComparisonPage from "./pages/ComparisonPage";
import Header from "./components/Header";
import Footer from "./components/Footer";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/subscriptions" element={<SubscriptionListPage />} />
        <Route path="/services" element={<ServiceSearchPage />} />
        <Route path="/services/:id" element={<ServiceDetailPage />} />
        <Route path="/comparison" element={<ComparisonPage />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;