import { useState, useEffect } from 'react';

export function usePersistentState(initialValue, key) {
  // Get the existing value from local storage or use the initial value
  const [state, setState] = useState(() => {
    const storedValue = localStorage.getItem(key);
    return storedValue !== null ? JSON.parse(storedValue) : initialValue;
  });

  // Whenever the state changes, update local storage
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}
