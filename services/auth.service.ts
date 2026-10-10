import crypto from "crypto";
import { userRepository } from "../repositories/user.repository";
import { ApiError } from "../utils/api-error";
import { IUser } from "../models/user.model";
import { IRole } from "../models/role.model";
import { JwtHelper } from "../helpers/jwt";
import { PasswordHelper } from "../helpers/password";
import { DateHelper } from "../helpers/date";
import { ERROR_CODES } from "../constants/error-codes";
import { MESSAGES } from "../constants/messages";
import { Session } from "../models/session.model";

export class AuthService {
  private async generateAccessToken(user: IUser, sessionId?: string): Promise<string> {
    let roleName = "Parent"; // fallback
    if (user.role && typeof user.role === "object" && "name" in user.role) {
      roleName = (user.role as IRole).name;
    } else if (user.role) {
      // Role is an ObjectId, fetch it
      const { roleRepository } = await import("../repositories/role.repository");
      const roleDoc = await roleRepository.findRoleById(user.role.toString());
      if (roleDoc) roleName = roleDoc.name;
    }
    return JwtHelper.signAccess({ userId: user._id.toString(), role: roleName, sessionId });
  }

  private async generateRefreshToken(user: IUser, sessionId: string, metadata: { deviceName?: string, platform?: string, appVersion?: string } = {}): Promise<string> {
    const token = JwtHelper.signRefresh({ userId: user._id.toString(), sessionId });
    const refreshTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    
    await Session.create({
      user: user._id,
      sessionId,
      refreshTokenHash,
      deviceName: metadata.deviceName,
      platform: metadata.platform,
      appVersion: metadata.appVersion,
      expiresAt: DateHelper.addDays(new Date(), 7)
    });
    
    return token;
  }

  async login(email: string, password: string, metadata: { deviceName?: string, platform?: string, appVersion?: string } = {}) {
    const user = await userRepository.findByEmailWithPassword(email);
    if (!user) {
      throw new ApiError(401, MESSAGES.AUTH.INVALID_CREDENTIALS, ERROR_CODES.AUTH_INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw new ApiError(403, MESSAGES.AUTH.ACCOUNT_DISABLED, ERROR_CODES.FORBIDDEN);
    }

    const isMatch = await PasswordHelper.compare(password, user.password as string);
    if (!isMatch) {
      throw new ApiError(401, MESSAGES.AUTH.INVALID_CREDENTIALS, ERROR_CODES.AUTH_INVALID_CREDENTIALS);
    }

    const sessionId = crypto.randomUUID();
    const accessToken = await this.generateAccessToken(user, sessionId);
    const refreshToken = await this.generateRefreshToken(user, sessionId, metadata);

    // Legacy fallback: Keep single string for backward compatibility where assumed
    await userRepository.updateRefreshToken(user._id.toString(), refreshToken);

    const userObj = typeof user.toObject === "function" ? user.toObject() : JSON.parse(JSON.stringify(user));
    delete userObj.password;
    delete userObj.refreshToken;

    return { user: userObj, accessToken, refreshToken };
  }

  async oauthLogin(user: IUser, metadata: { deviceName?: string, platform?: string, appVersion?: string } = {}) {
    if (!user.isActive) {
      throw new ApiError(403, MESSAGES.AUTH.ACCOUNT_DISABLED, ERROR_CODES.FORBIDDEN);
    }

    const sessionId = crypto.randomUUID();
    const accessToken = await this.generateAccessToken(user, sessionId);
    const refreshToken = await this.generateRefreshToken(user, sessionId, metadata);

    await userRepository.updateRefreshToken(user._id.toString(), refreshToken);

    const userObj = typeof user.toObject === "function" ? user.toObject() : JSON.parse(JSON.stringify(user));
    delete userObj.password;
    delete userObj.refreshToken;

    return { user: userObj, accessToken, refreshToken };
  }

  async logout(userId: string, sessionId?: string) {
    if (sessionId) {
      await Session.findOneAndUpdate({ sessionId, user: userId }, { isRevoked: true, revokedAt: new Date() });
    } else {
      await Session.updateMany({ user: userId }, { isRevoked: true, revokedAt: new Date() });
    }
    await userRepository.updateRefreshToken(userId, null);
  }

  async refresh(token: string) {
    const decoded = JwtHelper.verifyRefresh(token);
    if (!decoded) {
      throw new ApiError(401, MESSAGES.AUTH.UNAUTHORIZED, ERROR_CODES.AUTH_TOKEN_INVALID);
    }

    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      throw new ApiError(401, MESSAGES.AUTH.UNAUTHORIZED, ERROR_CODES.AUTH_TOKEN_INVALID);
    }

    if (decoded.sessionId) {
      const refreshTokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const session = await Session.findOne({ sessionId: decoded.sessionId, refreshTokenHash, isRevoked: false });
      if (!session) {
        throw new ApiError(401, MESSAGES.AUTH.UNAUTHORIZED, ERROR_CODES.AUTH_TOKEN_INVALID);
      }
      await Session.findByIdAndUpdate(session._id, { lastSeenAt: new Date() });
    } else if (user.refreshToken !== token) {
      // Legacy fallback
      throw new ApiError(401, MESSAGES.AUTH.UNAUTHORIZED, ERROR_CODES.AUTH_TOKEN_INVALID);
    }

    if (!user.isActive) {
      throw new ApiError(403, MESSAGES.AUTH.ACCOUNT_DISABLED, ERROR_CODES.FORBIDDEN);
    }

    const newAccessToken = await this.generateAccessToken(user, decoded.sessionId);
    
    // We do not rotate the refresh token here to keep mobile sessions stable, 
    // but if we do, we should revoke the old one. For now, just issue a new access token.
    // If the web client expects a rotated refresh token, we return the same one.
    const newRefreshToken = token;

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async changePassword(userId: string, oldPass: string, newPass: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new ApiError(404, "User not found", ERROR_CODES.USER_NOT_FOUND);

    const userWithPass = await userRepository.findByEmailWithPassword(user.email);
    if (!userWithPass) throw new ApiError(404, "User not found", ERROR_CODES.USER_NOT_FOUND);

    const isMatch = await PasswordHelper.compare(oldPass, userWithPass.password as string);
    if (!isMatch) {
      throw new ApiError(400, "Incorrect old password", ERROR_CODES.VALIDATION_ERROR);
    }

    const hashedPassword = await PasswordHelper.hash(newPass);

    await userRepository.update(userId, { password: hashedPassword });
    await userRepository.updateRefreshToken(userId, null); // Force re-login
  }

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new ApiError(404, "User with that email does not exist", ERROR_CODES.USER_NOT_FOUND);
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    
    const resetPasswordExpire = DateHelper.addMinutes(new Date(), 10); // 10 minutes

    await userRepository.update(user._id.toString(), {
      resetPasswordToken,
      resetPasswordExpire,
    });

    return resetToken;
  }

  async resetPassword(resetToken: string, newPass: string) {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await userRepository.findByResetToken(resetPasswordToken);

    if (!user) {
      throw new ApiError(400, "Invalid or expired reset token", ERROR_CODES.VALIDATION_ERROR);
    }

    const hashedPassword = await PasswordHelper.hash(newPass);

    await userRepository.update(user._id.toString(), {
      password: hashedPassword,
      resetPasswordToken: undefined,
      resetPasswordExpire: undefined,
    });
  }
}

export const authService = new AuthService();
