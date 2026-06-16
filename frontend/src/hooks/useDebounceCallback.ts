import { useEffect, useMemo, useRef } from "react";
import debounce from 'lodash.debounce'

const useDebounceCallback = (callback: Function, delay: number = 500) => {
  const ref = useRef<Function>(() => {});

  useEffect(() => {
    ref.current = callback;
  }, [callback]);

  const debouncedCallback = useMemo(() => {
    const func = (...args: any[]) => {
      ref.current?.(...args);
    };

    return debounce(func, delay);
  }, []);

  return debouncedCallback;
};

export default useDebounceCallback;
