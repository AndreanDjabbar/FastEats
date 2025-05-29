import express from "express";
import logger from "./config/loggerInit.js";
import startOrderPreparingConsumer from "./service/order-service/orderPreparingConsumer.js";
import startEmailVerificationConsumer from "./service/user-service/emailValidationConsumer.js";
import envInit from "./config/envInit.js";

envInit();
logger.info(`Using ${process.env.NODE_ENV} mode`);

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("📩 Email Verification Consumer Running...");
});

const PORT = process.env.PORT || 4000;

const start = async () => {
  try {
    await startEmailVerificationConsumer();
    await startOrderPreparingConsumer();
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error("❌ Failed to start consumers:", err);
    process.exit(1);
  }
};

start();