import mongoose from "mongoose";
import validator from "validator";
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lastName: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (v) => validator.isEmail(v, { require_tld: true }),
      message: "Email inválido",
    },
  },
  password: { type: String, required: true },
  role: { type: String, default: "user" },
});

const User = mongoose.model("user", userSchema);

export default User;
