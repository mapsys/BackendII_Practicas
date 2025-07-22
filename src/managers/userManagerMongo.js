import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export default class UserManager {
  async createUser({ name, lastName, email, password }) {
    const exists = await User.findOne({ email });
    if (exists) throw new Error("Email ya registrado");
    const role = email === "adminCoder@coder.com" ? "admin" : "user";
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, lastName, email, password: hashed, role });

    return user;
  }

  async findByEmail(email) {
    return await User.findOne({ email });
  }

  async validateUser(email, plainPassword) {
    const user = await this.findByEmail(email );
    if (!user) return null;

    const ok = await bcrypt.compare(plainPassword, user.password);
    return ok ? user : null;
  }
}
