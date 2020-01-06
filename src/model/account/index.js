import * as AccountApi from "Api/account";
const bcrypt = require("bcryptjs");

export const get = async (username, cxt) => {
  return await AccountApi.get(cxt).findOne({ username });
};

export const create = async ({ username, email, password }, cxt) => {
  const curr = await AccountApi.get(cxt).findOne({ username });

  if (curr) {
    throw new Error("account.exists", { username });
  }

  cxt.logger.debug("account.create", {
    username,
    email
  });

  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  const passwordHash = bcrypt.hashSync(password, salt);

  const added = new AccountApi.get(cxt)({
    username,
    email,
    password: passwordHash,
    status: "validating",
    created_at: new Date()
  });

  return await added.save();
};

export const remove = async (account, cxt) => {
  await account.remove();
  return true;
};

export const update = async (account, { status }, cxt) => {
  cxt.logger.debug("account.update", {
    username: account.username,
    status
  });

  account.status = status;
  return await account.save();
};

export const check = async (username, password, cxt) => {
  const curr = await AccountApi.get(cxt).findOne({
    username
  });

  cxt.logger.debug("account.check", {
    username,
    password
  });

  if (!curr) {
    cxt.logger.debug("account.user.notfound", {
      username
    });
    return null;
  }

  const comppms = (password, user) =>
    new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, isValid) => {
        if (err) {
          return reject(err);
        }
        if (!isValid) {
          return resolve(null);
        }

        cxt.logger.debug("account.user.ok", {
          username: user.username
        });
        return resolve(user);
      });
    });

  return await comppms(password, curr);
};
