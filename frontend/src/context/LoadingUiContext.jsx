import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useReducedMotion } from "motion/react";

const SPLASH_SESSION_KEY = "sirdavid-splash-seen";
const LoadingUiContext = createContext(null);

function clearScheduled(timeoutRefs, frameRef) {
  timeoutRefs.current.forEach((timer) => clearTimeout(timer));
  timeoutRefs.current = [];

  if (frameRef.current) {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
  }
}

export function LoadingUiProvider({ children }) {
  const location = useLocation();
  const reducedMotion = useReducedMotion();
  const [showSplash, setShowSplash] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeProgress, setRouteProgress] = useState(0);
  const timeoutsRef = useRef([]);
  const frameRef = useRef(0);
  const firstRouteRef = useRef(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    if (window.sessionStorage.getItem(SPLASH_SESSION_KEY)) {
      return undefined;
    }

    window.sessionStorage.setItem(SPLASH_SESSION_KEY, "1");
    setShowSplash(true);

    const timer = window.setTimeout(() => {
      setShowSplash(false);
    }, reducedMotion ? 120 : 2400);

    return () => {
      clearTimeout(timer);
    };
  }, [reducedMotion]);

  useEffect(() => {
    return () => {
      clearScheduled(timeoutsRef, frameRef);
    };
  }, []);

  useEffect(() => {
    if (firstRouteRef.current) {
      firstRouteRef.current = false;
      return undefined;
    }

    clearScheduled(timeoutsRef, frameRef);
    setRouteLoading(true);
    setRouteProgress(0);

    frameRef.current = window.requestAnimationFrame(() => {
      setRouteProgress(reducedMotion ? 100 : 14);
    });

    timeoutsRef.current.push(
      window.setTimeout(() => {
        setRouteProgress(reducedMotion ? 100 : 78);
      }, 36),
    );

    timeoutsRef.current.push(
      window.setTimeout(() => {
        setRouteProgress(100);
      }, reducedMotion ? 60 : 420),
    );

    timeoutsRef.current.push(
      window.setTimeout(() => {
        setRouteLoading(false);
        setRouteProgress(0);
      }, reducedMotion ? 120 : 760),
    );

    return () => {
      clearScheduled(timeoutsRef, frameRef);
    };
  }, [location.pathname, location.search, location.hash, reducedMotion]);

  return (
    <LoadingUiContext.Provider
      value={{
        reducedMotion,
        routeLoading,
        routeProgress,
        showSplash,
      }}
    >
      {children}
    </LoadingUiContext.Provider>
  );
}

export function useLoadingUi() {
  const context = useContext(LoadingUiContext);

  if (!context) {
    throw new Error("useLoadingUi must be used within LoadingUiProvider.");
  }

  return context;
}
