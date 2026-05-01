import dbConnect from "@/lib/db";
import User from "@/models/User";
import Builder from "@/models/Builder";
import Mandate from "@/models/Mandate";
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

  let builderId = undefined;
  let mandateId = undefined;

  // Create role-specific document
  if (userType === 'builder') {
    const builder = await Builder.create({
      email: email.toLowerCase(),
      password: password, // The model handles hashing if configured, but we already have passwordHash for User
      ...profileFields
    });
    builderId = builder._id;
  } else if (userType === 'mandate') {
    const mandate = await Mandate.create({
      email: email.toLowerCase(),
      password: password,
      ...profileFields
    });
    mandateId = mandate._id;
  }

  await User.create({
    email: email.toLowerCase(),
    passwordHash,
    role: userType, // MAP front-end userType to unified backend 'role'
    profile: profileFields,
    builderId,
    mandateId
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
    userType: user.role,
  });

  const userData = user.toObject();
  delete userData.passwordHash;

  // Fetch role-specific profile data if linked
  if (user.role === 'builder' && user.builderId) {
    const builderProfile = await Builder.findById(user.builderId);
    if (builderProfile) {
      userData.profile = { ...userData.profile, ...builderProfile.toObject() };
      delete userData.profile.password; // Security
    }
  } else if (user.role === 'mandate' && user.mandateId) {
    const mandateProfile = await Mandate.findById(user.mandateId);
    if (mandateProfile) {
      userData.profile = { ...userData.profile, ...mandateProfile.toObject() };
      delete userData.profile.password; // Security
    }
  }

  return { token, user: userData, message: "Login successful" };
}
