import { Router } from "express";
import { createPayment, handleStripeWebhook } from "../handlers/paymentHandler";

const router = Router()

router.post("/createPayment",createPayment)
router.post("/webhook",handleStripeWebhook)

export default router