import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await User.save({ validateBeforeSave: false });

    return {
      accessToken,
      refreshToken,
    };
  } catch (err) {
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
    [fullName, email, username, password].some((field) => field.trim() == "")
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

  const existedUser = User.findOne({
    $or: [{ email }, { username }],
  });

  console.log(existedUser);

  if (existedUser) {
    throw new ApiError(409, "User with email ot username already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is Required");
  }

  console.log("req.files : ", req.files);

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  let coverImage;
  if (coverImageLocalPath) {
    await uploadOnCloudinary(coverImage);
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

  if (!username || !email) {
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
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // by using this only modifiable from server only
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
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


const LogOut = asyncHandler(async (req,res)=>{
    // clear cookies
    // reset refresh Token
    // log out by _id
   await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken : undefined
        }
      },{
        new: true
      }
    )

    const options = {
      httpOnly: true,
      secure: true,
    };
    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200,{},"User Logged Out"))
})
export { registerUser, Login, LogOut };
