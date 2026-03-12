import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { PageSpinner, RouteLoadingBar, SplashScreen } from "./components/AppLoading";
import { StorefrontLayout } from "./components/StorefrontLayout";
import { LoadingUiProvider, useLoadingUi } from "./context/LoadingUiContext";

const AdminPortalPage = lazy(() =>
  import("./pages/AdminPortalPage").then((module) => ({ default: module.AdminPortalPage })),
);
const CartPage = lazy(() =>
  import("./pages/CartPage").then((module) => ({ default: module.CartPage })),
);
const LegalHubPage = lazy(() =>
  import("./pages/LegalHubPage").then((module) => ({ default: module.LegalHubPage })),
);
const PolicyPage = lazy(() =>
  import("./pages/PolicyPage").then((module) => ({ default: module.PolicyPage })),
);
const ProductPage = lazy(() =>
  import("./pages/ProductPage").then((module) => ({ default: module.ProductPage })),
);
const ShopPage = lazy(() =>
  import("./pages/ShopPage").then((module) => ({ default: module.ShopPage })),
);
const TrackOrderPage = lazy(() =>
  import("./pages/TrackOrderPage").then((module) => ({ default: module.TrackOrderPage })),
);

function AppRoutes() {
  const { routeLoading, routeProgress, showSplash } = useLoadingUi();

  return (
    <>
      <RouteLoadingBar progress={routeProgress} visible={routeLoading} />
      <SplashScreen visible={showSplash} />
      <Suspense fallback={<PageSpinner fullScreen />}>
        <Routes>
          <Route path="secure-admin-portal-xyz" element={<AdminPortalPage />} />
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
          </Route>
          <Route path="*" element={<Navigate to="/shop" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <LoadingUiProvider>
      <AppRoutes />
    </LoadingUiProvider>
  );
}
