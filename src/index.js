require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const graphqlHTTP = require("express-graphql");
const { makeExecutableSchema } = require("graphql-tools");
const { schema: rootSchema, resolvers: rootResolvers } = require("./schema");

import * as GraphCommon from "@nebulario/microservice-graph-common";
import * as Utils from "@nebulario/microservice-utils";
import * as Logger from "@nebulario/microservice-logger";

const ENV_MODE = process.env["ENV_MODE"];
const AUTH_DATA_INTERNAL_URL = process.env["AUTH_DATA_INTERNAL_URL"];

const AUTH_DATA_NAME = process.env["AUTH_DATA_NAME"];
const AUTH_DATA_SECRET_USER = process.env["AUTH_DATA_SECRET_USER"];
const AUTH_DATA_SECRET_PASSWORD = process.env["AUTH_DATA_SECRET_PASSWORD"];

const ACCOUNT_ROUTE_GRAPH = process.env["ACCOUNT_ROUTE_GRAPH"];
const ACCOUNT_INTERNAL_PORT_GRAPH = process.env["ACCOUNT_INTERNAL_PORT_GRAPH"];

const logger = Logger.create({ path: "/var/log/app", env: ENV_MODE });

const cxt = {
  services: {
    data: mongoose
  },
  logger
};

(async () => {
  await GraphCommon.Data.connect(
    {
      mongoose,
      url: AUTH_DATA_INTERNAL_URL,
      database: AUTH_DATA_NAME,
      user: AUTH_DATA_SECRET_USER,
      password: AUTH_DATA_SECRET_PASSWORD
    },
    cxt
  );

  var app = express();
  Logger.Service.use(app, cxt);

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
})().catch(e => cxt.logger.error("service.error", { error: e.toString() }));

Utils.Process.shutdown(signal => {
  console.log("Closing connection");
  mongoose.connection.close();
  console.log("Shutdown " + signal);
});
