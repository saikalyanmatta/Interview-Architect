import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import employerRouter from "./employer";
import candidateRouter from "./candidate";
import interviewRouter from "./interview";
import openaiRouter from "./openai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(employerRouter);
router.use(candidateRouter);
router.use(interviewRouter);
router.use(openaiRouter);

export default router;
