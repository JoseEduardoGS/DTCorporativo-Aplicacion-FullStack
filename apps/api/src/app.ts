import express from "express";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth";
import { usuariosRouter } from "./routes/usuarios";

export const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);


app.use("/usuarios", usuariosRouter);