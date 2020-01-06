require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const graphqlHTTP = require("express-graphql");
const { makeExecutableSchema } = require("graphql-tools");
const { schema: rootSchema, resolvers: rootResolvers } = require("./schema");

import * as GraphCommon from "@nebulario/microservice-graph-common";
import * as Utils from "@nebulario/microservice-utils";
import * as Logger from "@nebulario/microservice-logger";

import * as AccountApi from "Api/account";

const ENV_MODE = process.env["ENV_MODE"];
const ENV_LOG_FOLDER = process.env["ENV_LOG_FOLDER"];

const AUTH_DATA_INTERNAL_URL = process.env["AUTH_DATA_INTERNAL_URL"];
const AUTH_DATA_NAME = process.env["AUTH_DATA_NAME"];
const AUTH_DATA_SECRET_USER = process.env["AUTH_DATA_SECRET_USER"];
const AUTH_DATA_SECRET_PASSWORD = process.env["AUTH_DATA_SECRET_PASSWORD"];

const ACCOUNT_ROUTE_GRAPH = process.env["ACCOUNT_ROUTE_GRAPH"];
const ACCOUNT_INTERNAL_PORT_GRAPH = process.env["ACCOUNT_INTERNAL_PORT_GRAPH"];

const cxt = {
  services: {
    database: {
      mongoose,
      models: {}
    }
  },
  env: {
    mode: ENV_MODE,
    logs: {
      folder: ENV_LOG_FOLDER
    }
  },
  logger: null
};

cxt.logger = Logger.create({ path: ENV_LOG_FOLDER }, cxt);

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

  AccountApi.register(cxt);

  const app = express();
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
    cxt.logger.info("service.running", { port: ACCOUNT_INTERNAL_PORT_GRAPH })
  );
})().catch(e => cxt.logger.error("service.error", { error: e.toString() }));

Utils.Process.shutdown(signal => {
  mongoose.connection.close();
  cxt.logger.info("service.shutdown", { signal });
});
