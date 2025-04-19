import { Router } from "express";
import { changeBooking, deleteBookings, getBookings, getOneBookingForOneRoom, getOneRoomBookings, getOneRoomBookingsOfUser, postBookings } from "../handles/bookingHandler";
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

router
    .route("/:roomId")
    .get(getOneRoomBookingsOfUser)

router.get("/datesofBookings/:roomId",getOneRoomBookings)

router
    .route("/:roomId/:bookingId")
    .get(getOneBookingForOneRoom)
    .patch(changeBooking)
    .delete(deleteBookings)

export default router;
