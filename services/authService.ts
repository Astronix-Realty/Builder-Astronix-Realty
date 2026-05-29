import dbConnect from "@/lib/db";
import User from "@/models/User";
import Builder from "@/models/Builder";
import Mandate from "@/models/Mandate";
import { signToken } from "@/lib/auth";
import { IRegisterPayload, ILoginPayload, IAuthResponse } from "@/types/auth";
import bcrypt from "bcryptjs";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

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

  // Phone number validation
  if (profileFields.phone) {
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(profileFields.phone)) {
      throw new Error("Invalid phone number format. Must be 10-15 digits.");
    }
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
      password: password,
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
    role: userType,
    profile: profileFields,
    builderId,
    mandateId,
    loginAttempts: 0,
  });

  return { message: "Account created successfully. Please login to continue." };
}

export async function authenticateUser(
  payload: ILoginPayload,
  clientIp?: string
): Promise<{ token: string; user: any; message: string }> {
  await dbConnect();
  const { email, password, userType } = payload;

  if (!email || !password || !userType) {
    throw new Error("Email, password, and user type are required");
  }

  const user = await User.findOne({ email: email.toLowerCase(), role: userType, isDeleted: false });
  if (!user) {
    // Generic error to prevent user enumeration
    throw new Error("Invalid email or password. Please check your credentials.");
  }

  // --- Account Status Checks ---
  if (user.status === 'suspended') {
    throw new Error("Your account has been suspended. Please contact support.");
  }

  // --- Brute Force: Check if account is locked ---
  if (user.lockUntil && user.lockUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
    throw new Error(`Account temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`);
  }

  // --- Verify password ---
  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    // Increment failed attempts
    const attempts = (user.loginAttempts || 0) + 1;
    user.loginAttempts = attempts;

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      // Lock account for 15 minutes
      user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      user.loginAttempts = 0;
      await user.save();
      throw new Error(`Too many failed attempts. Account locked for 15 minutes.`);
    }

    const remaining = MAX_LOGIN_ATTEMPTS - attempts;
    await user.save();
    throw new Error(`Invalid email or password. ${remaining} attempt(s) remaining before lockout.`);
  }

  // --- Successful login: reset counters ---
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLoginAt = new Date();
  if (clientIp) user.lastLoginIp = clientIp;
  await user.save();

  const token = signToken({
    userId: user._id.toString(),
    email: user.email,
    userType: user.role,
  });

  const userData = user.toObject();
  delete userData.passwordHash;
  delete userData.otp;
  delete userData.otpExpiry;
  delete userData.passwordResetToken;

  // Fetch role-specific profile data if linked
  if (user.role === 'builder' && user.builderId) {
    const builderProfile = await Builder.findById(user.builderId);
    if (builderProfile) {
      userData.profile = { ...userData.profile, ...builderProfile.toObject() };
      delete userData.profile.password;
    }
  } else if (user.role === 'mandate' && user.mandateId) {
    const mandateProfile = await Mandate.findById(user.mandateId);
    if (mandateProfile) {
      userData.profile = { ...userData.profile, ...mandateProfile.toObject() };
      delete userData.profile.password;
    }
  }

  return { token, user: userData, message: "Login successful" };
}
