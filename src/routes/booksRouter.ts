import { Router } from "express";
import { changeBooking, deleteBookings, getBookings, getOneBookingForOneRoom, getOneRoomBookings, getOneRoomBookingsOfUser, postBookings } from "../handlers/bookingHandler";
import { body } from "express-validator";
import { protect } from "../modules/auth";
import { handleInputErrors } from "../middlewares/middleware";

const router = Router();

router.use(protect)

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
