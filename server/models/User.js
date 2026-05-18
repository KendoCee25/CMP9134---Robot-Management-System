/**
 * models/User.js — Mongoose User schema.
 *
 * Stores credentials and role. Passwords are hashed by the application layer
 * (users.js → bcryptjs) before the document is constructed; the schema itself
 * holds only the hash to keep the model thin and side-effect-free.
 */

const mongoose = require("mongoose");
const { ROLES } = require("../validation");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.VIEWER },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

module.exports = mongoose.model("User", userSchema);
