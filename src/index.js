require("dotenv").config();
const express = require("express");
const graphqlHTTP = require("express-graphql");
const { makeExecutableSchema } = require("graphql-tools");
const { schema: rootSchema, resolvers: rootResolvers } = require("./schema");
const mongoose = require("mongoose");

export function wait(timeout) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });
}

const INTERNAL_URL_DATA = process.env["INTERNAL_URL_DATA"];
const ROUTE_GRAPH = process.env["ROUTE_GRAPH"];
const INTERNAL_PORT_GRAPH = process.env["INTERNAL_PORT_GRAPH"];

(async () => {
  let db = null;
  let connected = false;

  while (!connected) {
    try {
      console.log("Connect to data service...");
      await mongoose.connect("mongodb://" + INTERNAL_URL_DATA, {
        useNewUrlParser: true,
        reconnectTries: 3,
        reconnectInterval: 100
      });

      mongoose.connection.on("disconnected", () => {
        console.log("-> lost connection");
      });
      mongoose.connection.on("reconnect", () => {
        console.log("-> reconnected");
      });
      mongoose.connection.on("connected", () => {
        console.log("-> connected");
      });
      mongoose.connection.on("reconnectFailed", () => {
        console.log("-> gave up reconnecting");
        process.exit(17);
      });
      connected = true;
    } catch (e) {
      console.log("DATA_ERROR:  " + e.toString());
      await wait(2500);
    }
  }

  var app = express();

  const schema = makeExecutableSchema({
    typeDefs: rootSchema,
    resolvers: rootResolvers
  });

  app.use(
    ROUTE_GRAPH,
    graphqlHTTP(request => ({
      schema: schema,
      graphiql: true,
      context: {
        request
      }
    }))
  );
  app.listen(INTERNAL_PORT_GRAPH, () =>
    console.log("Inner account GraphQL running...")
  );
})();

function shutdown(signal) {
  return async function(err) {
    console.log(`${signal}...`);
    if (err) {
      console.error(err.stack || err);
    }

    console.log("Closing connection");
    mongoose.connection.close();

    setTimeout(() => {
      process.exit(err ? 1 : 0);
    }, 500).unref();
  };
}

process
  .on("SIGTERM", shutdown("SIGTERM"))
  .on("SIGINT", shutdown("SIGINT"))
  .on("uncaughtException", shutdown("uncaughtException"));
