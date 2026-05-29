export type UserType = "builder" | "mandate";

export interface IAuthResponse {
  message?: string;
  error?: string;
  user?: any; // Replace with proper IUPser if needed
}

export interface ILoginPayload {
  email: string;
  password?: string;
  userType: UserType;
}

export interface IRegisterBuilderPayload {
  email: string;
  password?: string;
  confirmPassword?: string;
  userType: "builder";
  companyName?: string;
  developerName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  website?: string;
  experience?: string;
  logo?: string;
}

export interface IRegisterMandatePayload {
  email: string;
  password?: string;
  confirmPassword?: string;
  userType: "mandate";
  fullName?: string;
  companyName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  panNumber?: string;
  aadharNumber?: string;
  specialization?: string;
  preferredAreas?: string;
  experience?: string;
  logo?: string;
}

export type IRegisterPayload = IRegisterBuilderPayload | IRegisterMandatePayload;
