import dbConnect from "@/lib/db";
import User from "@/models/User";
import { signToken } from "@/lib/auth";
import { IRegisterPayload, ILoginPayload, IAuthResponse } from "@/types/auth";
import bcrypt from "bcryptjs";

export async function registerUser(payload: IRegisterPayload): Promise<IAuthResponse> {
  await dbConnect();
  const { email, password, confirmPassword, userType, ...profileFields } = payload;

  if (!email || !password || !userType) {
    throw new Error("Email, password, and user type are required");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  if (password !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  // Check if email already exists globally
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error("Email already registered. Please login instead.");
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  await User.create({
    email: email.toLowerCase(),
    passwordHash,
    role: userType, // MAP front-end userType to unified backend 'role'
    profile: profileFields,
  });

  return { message: "Account created successfully. Please login to continue." };
}

export async function authenticateUser(payload: ILoginPayload): Promise<{ token: string; user: any; message: string }> {
  await dbConnect();
  const { email, password, userType } = payload;

  if (!email || !password || !userType) {
    throw new Error("Email, password, and user type are required");
  }

  const user = await User.findOne({ email: email.toLowerCase(), role: userType });
  if (!user) {
    throw new Error("Invalid email or password. Please check your credentials.");
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error("Invalid email or password. Please check your credentials.");
  }

  const token = signToken({
    userId: user._id.toString(),
    email: user.email,
    userType: user.role, // Kept as userType in token payload for global compatibility
  });

  const userData = user.toObject();
  delete userData.passwordHash;

  return { token, user: userData, message: "Login successful" };
}
