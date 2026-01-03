import "dotenv/config";

import { z } from "zod/v4";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().default(5432),
  DB_USERNAME: z.string().default("postgres"),
  DB_PASSWORD: z.string().default(""),
  DB_NAME: z.string().default("chu"),
  DB_LOGGING: z.coerce.boolean().default(false),
  SUI_RPC_URL: z.string().default("https://fullnode.testnet.sui.io:443"),
  SUI_NETWORK: z.string().default("testnet"),
  SUI_PACKAGE_ID: z
    .string()
    .default("0xedc20852fba479e27d10cb05ca415cbb608dcb4fddc1f0749fbfa3e4c93c71b7"),
});

try {
  // eslint-disable-next-line node/no-process-env
  envSchema.parse(process.env);
}
catch (error) {
  if (error instanceof z.ZodError) {
    console.error("Missing environment variables:", error.issues.flatMap(issue => issue.path));
  }
  else {
    console.error(error);
  }
  process.exit(1);
}

// eslint-disable-next-line node/no-process-env
export const env = envSchema.parse(process.env);
