import path from "path";

export const register = ({
  services: {
    database: { mongoose, models }
  }
}) => {
  const schema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    status: { type: String, required: true },
    created_at: { type: Date }
  });

  schema.post("init", function(account) {});

  schema.pre("save", async function(next) {
    next();
  });

  const model = mongoose.model("Account", schema);

  models.account = {
    model,
    schema
  };
};

export const get = ({
  services: {
    database: { mongoose, models }
  }
}) => {
  if (!models.account) {
    throw new Error("account.unregister.model");
  }

  return models.account.model;
};
