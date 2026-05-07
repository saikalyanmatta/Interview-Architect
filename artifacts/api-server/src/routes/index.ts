import { Router, type IRouter } from "express";
import healthRouter from "./health";
import replitAuthRouter from "./replitAuth";
import employerRouter from "./employer";
import candidateRouter from "./candidate";
import interviewRouter from "./interview";
import openaiRouter from "./openai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(replitAuthRouter);
router.use(employerRouter);
router.use(candidateRouter);
router.use(interviewRouter);
router.use(openaiRouter);

export default router;
