import { Application } from "./Application";

const application = new Application();

process.on("exit", async () => {
  await application.stop();
});

process.on("SIGINT", async () => {
  await application.stop();
});

setImmediate(async () => await application.start());