import { Router } from "express";
import { createPayment, handleStripeWebhook } from "../handles/paymentHandler";

const router = Router()

router.post("/createPayment",createPayment)
router.post("/webhook",handleStripeWebhook)

export default router