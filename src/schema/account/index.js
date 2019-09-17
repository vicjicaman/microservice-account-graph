import * as Account from "Model/account";
const bcrypt = require("bcryptjs");

const schema = [
  ...Account.Schema,
  `
  type AccountQueries {
    check (username:String!, password:String!): Account
    get (username:String!): Account
  }

  type AccountMutations {
    create (username:String!, email: String!, password:String!): Account!
    delete (username:String!): Boolean
  }
`
];

const compare = (password, user) =>
  new Promise((resolve, reject) => {
    bcrypt.compare(password, user.password, (err, isValid) => {
      if (err) {
        return reject(err);
      }
      if (!isValid) {
        return resolve(null);
      }
      return resolve(user);
    });
  });

const resolvers = {
  AccountQueries: {
    check: async (viewer, { username, password }, cxt) => {
      const curr = await Account.Model.findOne({
        username
      });

      if (!curr) {
        return null;
      }

      return await compare(password, curr);
    },
    get: async (viewer, { username }, cxt) =>
      await Account.Model.findOne({
        username
      })
  },
  AccountMutations: {
    create: async (viewer, { username, email, password }, cxt) => {
      const curr = await Account.Model.findOne({
        username
      });

      if (curr) {
        throw new Error("ACCOUNT_EXISTS");
      }

      const added = new Account.Model({
        username,
        email,
        password
      });
      return await added.save();
    },
    delete: async (viewer, { username }, cxt) => {
      const curr = await Account.Model.findOne({
        username
      });

      if (!curr) {
        throw new Error("ACCOUNT_DOESNT_EXIST");
      }

      await curr.remove();
      return true;
    }
  }
};

export { schema, resolvers };
