import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { validateEmail, validatePassword } from "../utils/ValidationsMethods.js";
import Jwt from "jsonwebtoken";

// cookies Option 
// by using this only modifiable from server only
const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // Set to true in production
  sameSite: 'None', // Adjust as needed based on your requirements
};

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return {
      accessToken,
      refreshToken,
    };
  } catch (err) {
    console.log(err)
    throw new ApiError(
      500,
      "Something went wrong while generate access and refresh Token"
    );

  }
};
const registerUser = asyncHandler(async (req, res) => {
  // get data,
  // validate data,
  // check if already exists
  // check images, check for avatar
  // upload cloudinary and extract URL
  // check avatar uploded or not
  // create User object as request body
  // insert data into db
  // return response

  const { username, email, fullName, password } = req.body;

  if (
    [fullName, email, username, password].some((field) => field?.trim() == "")
  ) {
    throw new ApiError(400, `All fields are required`);
  }

  if (!validateEmail(email)) {
    throw new ApiError(400, `Please check email format`);
  }

  if (!validatePassword(password)) {
    throw new ApiError(
      400,
      "Password must contain  at least one number and one special character"
    );
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  })


  if (existedUser) {
    throw new ApiError(409, "User with email ot username already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  //console.log("req.files : ", req.files);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is Required");
  }


  const avatar = await uploadOnCloudinary(avatarLocalPath);
  let coverImage = coverImageLocalPath;
  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }
  if (!avatar) {
    throw new ApiError(400, "Avatar file is Required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while register User");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Created Successfully"));
});

const Login = asyncHandler(async (req, res) => {
  // Get User login data
  // validate data -> username or email
  // match from database
  // generate Access and refresh token
  // send cookies
  // send it to response

  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  let user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User dose not exist");
  }

  const passwordValid = await user.isPasswordCorrect(password);

  if (!passwordValid) {
    throw new ApiError(401, "Incorrect Password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id.toString()
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});


const LogOut = asyncHandler(async (req, res) => {
  // clear cookies
  // reset refresh Token
  // log out by _id
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    }, {
    new: true
  }
  )
  return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"))
})


const refreshAccessToken = asyncHandler(async (req, res) => {
  let IncomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  if (!IncomingRefreshToken) {
    throw new ApiError(400, 'Unauthorized Request')
  }
  try {

    const decodedToken = Jwt.verify(IncomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    let user = await User.findById(decodedToken?._id)

    if (!user) {
      throw new ApiError(401, "Invalid refresh Token")

    }

    if (IncomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token expired or used")
    }

    const tokens = await generateAccessAndRefreshTokens(
      user._id.toString()
    );
    return res
      .status(200)
      .cookie('accessToken', tokens.accessToken, options)
      .cookie('refreshToken', tokens.refreshToken, options)
      .json(
        new ApiResponse(200, {
          tokens
        },
          "Access token refreshed"
        )
      )
  } catch (error) {
    throw new ApiError(500, error?.message, "Something went wrong")
  }
})


const changeCurrentPassword = asyncHandler(async (req, res) => {
  // todo check newPassword and confirmPassword validation 
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!(newPassword === confirmPassword)) {
    throw new ApiError(400, "New password and confirm password should be same");
  }

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Old password")
  }


  user.password = newPassword

  await user.save({ validateBeforeSave: false })

  return res.status(200)
    .json(new ApiResponse(200, {}, "Password Changed"))
})



const currentUser = asyncHandler(async (req, res) => {
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  return res.status(200)
    .json(new ApiResponse(200, user, "Current User"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, 'All fields are required')
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email
      }
    },
    { new: true }
  ).select("-password")

  return res.status(200)
    .json(new ApiResponse(200, user, "Account Details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {

  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading Avatar");

  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    { new: true }
  ).select("-password")

  return res.status(200)
    .json(new ApiResponse(200, user, "Avatar Updated successfully"))
})


const updateCoverImage = asyncHandler(async (req, res) => {

  const coverLocalPath = req.file?.path;

  if (!coverLocalPath) {
    throw new ApiError(400, "Cover Image file is missing");
  }

  const coverImage = await uploadOnCloudinary(coverLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading Avatar");

  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    { new: true }
  ).select("-password")

  return res.status(200)
    .json(new ApiResponse(200, user, "Cover Image Updated successfully"))
})

export {
  registerUser,
  Login,
  LogOut,
  refreshAccessToken,
  currentUser,
  changeCurrentPassword,
  updateAccountDetails,
  updateUserAvatar,
  updateCoverImage
};


// counting of doc where channel name is name of channale 
