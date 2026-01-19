import pino from "pino";
import dayjs from "dayjs";

const isProd = process.env.NODE_ENV === "production";

const baseConfig = {
  base: { pid: false },
  timestamp: () => `,"time":"${dayjs().format()}"`,
};

const logger = pino(
  isProd
    ? { ...baseConfig, level: process.env.LOG_LEVEL || "info" }
    : {
        ...baseConfig,
        level: process.env.LOG_LEVEL || "info",
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            singleLine: true,
            translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
            ignore: "pid",
          },
        },
      }
);

export default logger;
