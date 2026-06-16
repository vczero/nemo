import { useEffect, useMemo, useRef } from "react";
import throttle from 'lodash.throttle'

const useThrottle = (callback: Function, delay: number = 500) => {
  const ref = useRef<Function>(() => {});

  useEffect(() => {
    ref.current = callback;
  }, [callback]);

  const throttledCallback = useMemo(() => {
    const func = (...args: any[]) => {
      ref.current?.(...args);
    };

    return throttle(func, delay);
  }, []);

  return throttledCallback;
};

export default useThrottle;
