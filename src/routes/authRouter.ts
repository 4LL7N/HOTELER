import { Router } from "express";
import { createUser, login } from "../handles/authHandler";

 const router = Router()

 router.post("/register",createUser)
 router.post("/login",login)

 export default router