import { FastifyInstance } from "fastify";

import { StreamChat } from "stream-chat";

const streamChat = StreamChat.getInstance(
  process.env.STREAM_API_KEY!,
  process.env.STREAM_PRIVATE_API_KEY!
);

const TOKEN_USER_ID_MAP = new Map<string, string>();

export async function userRoutes(app: FastifyInstance) {
  app.post<{ Body: { id: string; name: string; image?: string } }>(
    "/signup",
    async (req, res) => {
      const { id, name, image } = req.body;
      if (id == null || id === "" || name == null || name === "") {
        return app.httpErrors.badRequest("All Fields are required");
      }

      const existingUser = await streamChat.queryUsers({ id });

      if (existingUser.users.length > 0) {
        return app.httpErrors.badRequest("User already exists");
      }
      await streamChat.upsertUser({ id, name, image });
    }
  );

  app.post<{ Body: { id: string } }>("/login", async (req, res) => {
    const { id } = req.body;
    if (id == null || id === "") {
      return app.httpErrors.badRequest("All Fields are required");
    }

    const {
      users: [user],
    } = await streamChat.queryUsers({ id });

    if (user == null) return app.httpErrors.unauthorized("Username is wrong");

    const token = streamChat.createToken(id);

    TOKEN_USER_ID_MAP.set(token, user.id);

    return {
      token,
      user: { name: user.name, id: user.id, image: user.image },
    };
  });

  app.post<{ Body: { token: string } }>("/logout", async (req, res) => {
    const token = req.body.token;

    if (token == null && token === "")
      return app.httpErrors.unauthorized("User not logged in");

    const id = TOKEN_USER_ID_MAP.get(token);

    if (id == null) return app.httpErrors.badRequest("User not logged in");

    streamChat.revokeUserToken(id, new Date());
    TOKEN_USER_ID_MAP.delete(token);
  });
}
