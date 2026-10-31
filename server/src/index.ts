import { createServer } from "node:http";
import { handleApiRequest } from "./routes/api.ts";

export const server = createServer((req, res) => {
  handleApiRequest(req, res);
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(
      `[spayway-server] Backend API running on http://localhost:${PORT}`
    );
  });
}
