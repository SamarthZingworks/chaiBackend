import { Router } from "express";
import { LogOut, Login, refreshAccessToken, registerUser } from "../controller/user.controller.js";
import {upload} from "../middleware/multer.middleware.js"
import { VerifyJWT } from "../middleware/ayth.middleware.js";
const router = Router()

router.route("/register").post(upload.fields([
    {
        name: 'avatar',
        maxCount: 1,
        
    },{
        name: "coverImage",
        maxCount: 1
    }
]), registerUser)

router.route("/login").post(Login)


//  Secured Routes
router.route("/logout").post(VerifyJWT, LogOut)
router.route("/refreshToken").post(refreshAccessToken)


export default router
