import * as Account from "./account";
const { GraphQLDate, GraphQLDateTime } = require("graphql-iso-date");

const schema = [
  ...Account.schema,
  `
  scalar DateTime
  scalar Date

  type Viewer {
    id: ID
    username: String
    accounts: AccountQueries
  }

  type ViewerMutations {
    id: ID
    username: String
    accounts: AccountMutations
  }

  type Query {
    viewer: Viewer
  }

  type Mutation {
    viewer: ViewerMutations
  }
`
];

const getViewer = cxt => {
  return {};
};

const resolvers = {
  Date: GraphQLDate,
  DateTime: GraphQLDateTime,
  ...Account.resolvers,
  Query: {
    viewer: (parent, args, cxt) => getViewer(cxt)
  },
  Mutation: {
    viewer: (parent, args, cxt) => getViewer(cxt)
  },
  Viewer:{
    accounts: viewer => viewer
  },
  ViewerMutations:{
    accounts: viewer => viewer
  }
};

export { schema, resolvers };
