import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function useUsernameAvailability(username: string) {
  const [debounced, setDebounced] = useState(username);

  // debounce username changes
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(username), 400);
    return () => clearTimeout(handler);
  }, [username]);

  return useQuery({
    queryKey: ["username", debounced],
    queryFn: async () => {
      if (!debounced) return null;
      const res = await fetch(`/api/check-username?username=${debounced}`);
      return res.json();
    },
    enabled: !!debounced,
  });
}
