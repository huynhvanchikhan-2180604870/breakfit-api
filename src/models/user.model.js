const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * User model for authentication and basic user information
 * Modern ES7+ style with arrow functions and async/await
 */
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email là bắt buộc"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Email không hợp lệ",
      ],
    },
    passwordHash: {
      type: String,
      required: [true, "Mật khẩu là bắt buộc"],
      minlength: [6, "Mật khẩu phải có ít nhất 6 ký tự"],
    },
    name: {
      type: String,
      required: [true, "Tên là bắt buộc"],
      trim: true,
      maxlength: [100, "Tên không được quá 100 ký tự"],
    },
    roles: {
      type: [String],
      enum: ["user", "admin"],
      default: ["user"],
    },
    appleSub: String, // Apple subscription ID for iOS users
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: Date,
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true, // Tự động tạo createdAt và updatedAt
    toJSON: { virtuals: true }, // Include virtuals when converting to JSON
    toObject: { virtuals: true },
  }
);

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ roles: 1 });
userSchema.index({ isActive: 1 });

// Virtual for user ID (without ObjectId)
userSchema.virtual("userId").get(function () {
  return this._id.toString();
});

// Pre-save middleware
userSchema.pre("save", async function (next) {
  try {
    // Hash password if modified
    if (this.isModified("passwordHash")) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
userSchema.methods = {
  /**
   * Compare provided password with stored hash
   */
  async comparePassword(password) {
    return bcrypt.compare(password, this.passwordHash);
  },

  /**
   * Check if user has specific role
   */
  hasRole(role) {
    return this.roles.includes(role);
  },

  /**
   * Check if user is admin
   */
  isAdmin() {
    return this.hasRole("admin");
  },

  /**
   * Get public profile (without sensitive data)
   */
  getPublicProfile() {
    const {
      passwordHash,
      emailVerificationToken,
      passwordResetToken,
      ...publicData
    } = this.toObject();
    return publicData;
  },
};

// Static methods
userSchema.statics = {
  /**
   * Find user by email
   */
  async findByEmail(email) {
    return this.findOne({ email: email.toLowerCase() });
  },

  /**
   * Find active users
   */
  async findActiveUsers() {
    return this.find({ isActive: true });
  },

  /**
   * Get user count by role
   */
  async getUserCountByRole() {
    return this.aggregate([
      { $group: { _id: "$roles", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
  },
};

module.exports = mongoose.model("User", userSchema);
