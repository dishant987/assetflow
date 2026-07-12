import { useQuery } from "@tanstack/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";

const queryClient = new QueryClient();

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

function HealthCheck() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["health"],
    queryFn: () => axios.get(`${API_URL}/health`).then((r) => r.data),
  });

  if (isLoading) return <p>Connecting to server…</p>;
  if (error) return <p style={{ color: "red" }}>Server unreachable</p>;

  return <p>Server status: {data?.status}</p>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HealthCheck />
    </QueryClientProvider>
  );
}

export default App;
