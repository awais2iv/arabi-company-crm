import mongoose, { Schema } from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema({
    // Basic Info - Matching FlexiPay structure
    firstname: {
        type: String,
        required: true,
        trim: true,
    },
    lastname: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        trim: true,
        // Virtual field - computed from firstname + lastname
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    password: {
        type: String,
        required: [true, "Password is Required"]
    },
    
    // OTP fields (for email verification) - FlexiPay pattern
    otp: {
        type: String
    },
    otpExpiry: {
        type: Date
    },
    otpToken: {
        type: String
    },
    resetOtp: {
        type: String
    },
    resetOtpExpiry: {
        type: Date
    },
    
    // Verification & Status - FlexiPay pattern
    isVerified: {
        type: Boolean,
        default: false,
        required: true
    },
    status: {
        type: String,
        enum: ["active", "suspended", "pending"],
        default: "pending",
        required: true
    },
    
    // Tokens - FlexiPay pattern
    refreshToken: {
        type: String,
    },
    accessToken: {
        type: String
    },
    
    // Profile Image - FlexiPay pattern (S3 URL)
    image: {
        type: String, // S3 URL for profile picture
    },
    avatar: {
        type: String, // Alias for backward compatibility
    },
    
    // Role System - Avaya specific (agent/admin instead of FlexiPay's types)
    role: {
        type: String,
        enum: ["agent", "admin"],
        required: true,
        default: "agent"
    },
    
    // Notification Settings - FlexiPay pattern
    notificationSettings: {
        email: {
            type: Boolean,
            default: true
        },
        push: {
            type: Boolean,
            default: true
        },
        inApp: {
            type: Boolean,
            default: true
        }
    }
}, { timestamps: true });

// Add compound unique index for email + role combination
// This allows same email for different roles (agent vs admin) if needed
userSchema.index({ email: 1, role: 1 }, { unique: true });

// Virtual field for full name
userSchema.virtual('fullname').get(function() {
    return `${this.firstname} ${this.lastname}`;
});

// Pre-save hook to hash password when modified - FlexiPay pattern
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next()
});

// Pre-save hook to sync name field
userSchema.pre("save", function (next) {
    if (this.firstname && this.lastname) {
        this.name = `${this.firstname} ${this.lastname}`;
    }
    next();
});

// Method to check if password is correct - FlexiPay pattern
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

// Generate access token - FlexiPay pattern with Avaya role structure
userSchema.methods.generateAccessToken = function () {
    const payload = {
        _id: this._id,
        email: this.email,
        name: this.name || `${this.firstname} ${this.lastname}`,
        fullname: `${this.firstname} ${this.lastname}`,
        role: this.role // agent or admin
    };
    
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    });
}

// Generate refresh token - FlexiPay pattern
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id,
    }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    });
}

// Generate OTP token - FlexiPay pattern
userSchema.methods.generateOTPToken = function (otp) {
    return jwt.sign(
        {
            _id: this._id,
            otp: otp,
        },
        process.env.OTP_TOKEN_SECRET,
        {
            expiresIn: '5m', // 5 minutes - hardcoded like FlexiPay
        }
    );
}

export const User = mongoose.model("Users", userSchema);
