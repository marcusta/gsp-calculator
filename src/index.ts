import app from "./server";

const port = parseInt(process.env.PORT || "3004");

console.log(`Server is running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
