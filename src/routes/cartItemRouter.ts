import { Router,Request ,Response, NextFunction } from "express";
import { deleteCartItem, getAllCartItems, getCartItem, postCartItem, updateCartItem } from "../handlers/cartItemHandler";
import { protect } from "../modules/auth";
import { PrismaClientKnownRequestError, PrismaClientValidationError } from "@prisma/client/runtime/library";
import { body } from "express-validator";
import { handleInputErrors } from "../middlewares/middleware";

const router = Router()

router.use(protect)

router
    .route("/")
    .get(getAllCartItems)
    .post(
        body(["checkIn", "checkOut"]).isISO8601(),
        body("roomId").isString(),
        body(["adults", "children"]).isNumeric(),
        handleInputErrors,
        postCartItem
    )

router
    .route("/:id")
    .get(getCartItem)
    .patch(
      body(["checkIn", "checkOut"]).isISO8601(),
      body(["adults", "children"]).isNumeric(),
      updateCartItem
    )
    .delete(deleteCartItem)

router.use(async(err:Error,req:Request,res:Response,next:NextFunction)=>{

  if (err instanceof PrismaClientKnownRequestError && err.code === 'P2025' ) {
    res.status(404).json({
      status: 'fail',
      error: 'Resource not found',
      message: 'The requested item does not exist or you lack permissions',
      details: process.env.NODE_ENV === 'development' ? err.meta : undefined
    });
    return
  }
    
      if (err instanceof PrismaClientKnownRequestError) {
        res.status(400).json({
          status: 'fail',
          message: 'Database operation failed',
          code: err.code,
          meta: err.meta,
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
        return
      }

      const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
      res.status(statusCode).json({
        status: 'error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
})

export default router