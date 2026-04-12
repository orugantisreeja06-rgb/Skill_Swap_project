const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },

    password: {
      type: String,
      required: function requirePassword() {
        return !this.googleId;
      },
    },

    // 🔥 Skills (renamed for clarity + consistency)
    skillsOffered: {
      type: [String],
      default: [],
    },

    skillsWanted: {
      type: [String],
      default: [],
    },

    // 🔥 Extra (very useful for your project)
    bio: {
      type: String,
      default: "",
    },
    ratings: [{
      value: {
        type: Number,
        min: 1,
        max: 5,
        required: true
      },
      review: {
        type: String,
        default: ""
      },
      fromUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);