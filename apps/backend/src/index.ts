import app from "./app.js";
import { env } from "./env.js";
import { initializeDataSource } from "./db/data-source.js";

const port = env.PORT;

initializeDataSource()
  .then(() => {
    const server = app.listen(port, () => {
      /* eslint-disable no-console */
      console.log(`Listening: http://localhost:${port}`);
      /* eslint-enable no-console */
    });

    server.on("error", (err) => {
      if ("code" in err && err.code === "EADDRINUSE") {
        console.error(`Port ${env.PORT} is already in use. Please choose another port or stop the process using it.`);
      }
      else {
        console.error("Failed to start server:", err);
      }
      process.exit(1);
    });
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("Failed to initialize database:", error);
    process.exit(1);
  });
