import User from '../models/User';
class UserController {
  async store(req, res) {
    const {
      name,
      email
    } = await User.create(
      req.body,
    );

    return res.json({
      name,
      email
    });
  }
}

export default new UserController();