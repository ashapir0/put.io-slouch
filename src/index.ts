import { Application } from "./Application";

const application = new Application();

process.on("SIGTERM", async () => await application.stop());
process.on("SIGINT", async () => await application.stop());

setImmediate(async () => await application.start());

