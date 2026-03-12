import { Navigate, Route, Routes } from "react-router-dom";

import { StorefrontLayout } from "./components/StorefrontLayout";
import { AdminPortalPage } from "./pages/AdminPortalPage";
import { CartPage } from "./pages/CartPage";
import { LegalHubPage } from "./pages/LegalHubPage";
import { PolicyPage } from "./pages/PolicyPage";
import { ProductPage } from "./pages/ProductPage";
import { ShopPage } from "./pages/ShopPage";
import { TrackOrderPage } from "./pages/TrackOrderPage";

export default function App() {
  return (
    <Routes>
      <Route element={<StorefrontLayout />}>
        <Route index element={<ShopPage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="product/:id" element={<ProductPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="track-order" element={<TrackOrderPage />} />
        <Route
          path="terms-and-conditions"
          element={<PolicyPage policyKey="terms-and-conditions" />}
        />
        <Route path="refund-policy" element={<PolicyPage policyKey="refund-policy" />} />
        <Route path="privacy-policy" element={<PolicyPage policyKey="privacy-policy" />} />
        <Route path="shipping-policy" element={<PolicyPage policyKey="shipping-policy" />} />
        <Route path="faqs" element={<PolicyPage policyKey="faqs" />} />
        <Route path="legal" element={<LegalHubPage />} />
        <Route path="secure-admin-portal-xyz" element={<AdminPortalPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/shop" replace />} />
    </Routes>
  );
}
