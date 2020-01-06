import * as Account from "Model/account";

const schema = [
  `
 type Account {
   id: ID
   username: String!
   name: String
   email: String!
   status: String!
   created_at: DateTime!
 }

  type AccountQueries {
    check (username:String!, password:String!): Account
    get (username:String!): Account
  }

  type AccountMutations {
    create (username:String!, email: String!, password:String!): Account!
    account(username:String!): AccountEntityMutations
  }

  type AccountEntityMutations {
    update (status:String!): Account!
    remove: Boolean!
  }
`
];

const resolvers = {
  AccountQueries: {
    check: async (viewer, { username, password }, cxt) =>
      await Account.check(username, password, cxt),
    get: async (viewer, { username }, cxt) => await Account.get(username, cxt)
  },
  AccountMutations: {
    create: async (viewer, { username, email, password }, cxt) =>
      await Account.create({ username, email, password }, cxt),
    account: async (viewer, { username }, cxt) =>
      await Account.get(username, cxt)
  },
  AccountEntityMutations: {
    update: async (account, { status }, cxt) =>
      await Account.update(account, { status }, cxt),
    remove: async (account, {}, cxt) => await Account.remove(account, cxt)
  }
};

export { schema, resolvers };
