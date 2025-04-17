import { Router } from "express";
import { getBookings, postBookings } from "../handles/bookingHandler";
import { body } from "express-validator";
import { handleInputErrors } from "../middlewares/bookingMiddlware";

const router = Router();

router
  .route("/")
  .get(getBookings)
  .post(
    body(["checkIn", "checkOut"]).isISO8601(),
    body("roomId").isString(),
    handleInputErrors,
    postBookings
  );

// router
//     .route("/")
//     .get()
//     .post()

export default router;
