require("dotenv").config();
const express = require("express");
const graphqlHTTP = require("express-graphql");
const { makeExecutableSchema } = require("graphql-tools");
const { schema: rootSchema, resolvers: rootResolvers } = require("./schema");
const mongoose = require("mongoose");
import * as GraphCommon from "@nebulario/microservice-graph-common";
import * as Utils from "@nebulario/microservice-utils";

const AUTH_DATA_INTERNAL_URL = process.env["AUTH_DATA_INTERNAL_URL"];
const ACCOUNT_ROUTE_GRAPH = process.env["ACCOUNT_ROUTE_GRAPH"];
const ACCOUNT_INTERNAL_PORT_GRAPH = process.env["ACCOUNT_INTERNAL_PORT_GRAPH"];

(async () => {
  const cxt = { mongoose };

  GraphCommon.Data.connect({ mongoose, url: AUTH_DATA_INTERNAL_URL }, cxt);

  var app = express();

  const schema = makeExecutableSchema({
    typeDefs: rootSchema,
    resolvers: rootResolvers
  });

  app.use(
    ACCOUNT_ROUTE_GRAPH,
    graphqlHTTP(request => ({
      schema: schema,
      graphiql: true,
      context: {
        request
      }
    }))
  );
  app.listen(ACCOUNT_INTERNAL_PORT_GRAPH, () =>
    console.log("Inner account GraphQL running...")
  );
})();

Utils.Process.shutdown(() => {
  console.log("Closing connection");
  mongoose.connection.close();
});
