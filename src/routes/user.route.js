import { Router } from "express";
import { LogOut, Login, changeCurrentPassword, currentUser, 
         getUserChannelProfile, getWatchHistory, refreshAccessToken, 
         registerUser, updateAccountDetails, updateCoverImage, 
         updateUserAvatar } from "../controller/user.controller.js";
import { upload } from "../middleware/multer.middleware.js"
import { VerifyJWT } from "../middleware/ayth.middleware.js";
const router = Router()

router.route("/register").post(upload.fields([
    {
        name: 'avatar',
        maxCount: 1,

    }, {
        name: "coverImage",
        maxCount: 1
    }
]), registerUser)

router.route("/login").post(Login)


//  Secured Routes

// logout route
router.route("/logout").post(VerifyJWT, LogOut)
// refreshToken route
router.route("/refreshToken").post(refreshAccessToken)
// change password route
router.route("/changePassword").post(VerifyJWT, changeCurrentPassword)
//get current user
router.route("/currentUser").get(VerifyJWT, currentUser)
// updateAccountDetails
router.route("/updateAccountDetails").patch(VerifyJWT, updateAccountDetails)
// updateUserAvatar
router.route("/updateUserAvatar").patch(VerifyJWT, upload.single("avatar"), updateUserAvatar)
// updateCoverImage
router.route("/updateCoverImage").patch(VerifyJWT, upload.single("coverImage"), updateCoverImage)
// getUserChannelProfile
router.route("/channel/:username").get(VerifyJWT, getUserChannelProfile)
// getWatchHistory
router.route("/watchHistory").get(VerifyJWT, getWatchHistory)



export default router
