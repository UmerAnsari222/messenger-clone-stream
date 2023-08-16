import { config } from "dotenv";

config();

import fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";

import { userRoutes } from "./routes/users";

const app = fastify();

app.register(cors, { origin: true });
app.register(sensible);
app.register(userRoutes);

app.listen({ port: parseInt(process.env.PORT!) });
