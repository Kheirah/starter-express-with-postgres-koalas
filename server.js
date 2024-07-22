require("dotenv").config();
const express = require("express");
const { sql } = require("@vercel/postgres");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ msg: "Hello from the Notes App - This is the demo" });
});

/* DONE ✅
  - [x] create a new user
*/
app.post("/users", async (req, res) => {
  const { name } = req.body;
  const { rowCount } = await sql`INSERT INTO users (name) VALUES (${name})`;

  if (rowCount) {
    res.json({ message: `User with name ${name} was successfully created.` });
  } else {
    res.json({ message: `User with name ${name} COULD NOT be created.` });
  }
});

/* DONE ✅
  - [x] list all users
*/
app.get("/users", async (req, res) => {
  const { rows } = await sql`SELECT * FROM users`;
  res.json(rows);
});

/* DONE ✅
  - [x] change route to something like "/:user/notes"
  - [x] check if user exists
  - [x] return all notes by that user
*/
app.get("/:user/notes", async (req, res) => {
  const { user } = req.params;

  try {
    const { rows, rowCount } = await sql`
        SELECT notes.id, notes.content, notes."createdAt", notes."userId" FROM notes
        JOIN users ON notes."userId" = users.id
        WHERE UPPER(users.name) = UPPER(${user})
      `;

    if (rowCount > 0) {
      res.send(rows);
    } else {
      res.send({ message: "Notes could NOT be found." });
    }
  } catch (error) {
    res.send({ message: `Something went wrong. ${error}` });
  }
});

/* DONE ✅
  - [x] change route to something like "/:user/notes/:id"
  - [x] check if user exists
  - [x] return the individual note by that user
*/
app.get("/:user/notes/:id", async (req, res) => {
  const { user, id } = req.params;

  try {
    const { rows: rowsUser } =
      await sql`SELECT * FROM users WHERE UPPER(name) = UPPER(${user})`;

    /* if the user DOES NOT EXIST respond with a message and return from the function */
    if (!rowsUser.length) {
      return res.json({ message: `Could NOT find the user ${user}.` });
    }

    const { rows } = await sql`SELECT * FROM notes
                                INNER JOIN users ON notes."userId" = users.id
                                WHERE notes.id = ${id}
                                AND users.id = ${rowsUser[0].id}`;

    if (!rows.length) {
      return res.json({ message: `Could NOT find the note with id ${id}.` });
    }

    res.json(rows[0]);
  } catch (error) {
    return res.json({ message: "An error occurred." });
  }
});

/* DONE ✅
  - [x] change route to something like "/:user/notes"
  - [x] check if user exists
  - [x] return success/failure message
*/
app.post("/:user/notes", async (req, res) => {
  const { user } = req.params;
  const { content, category } = req.body;

  if (!content || !category) {
    return res.json({
      message:
        "Could NOT add note because content and category were not provided.",
    });
  }

  const { rows } = await sql`SELECT * FROM users WHERE name = ${user}`;

  /* if the user DOES NOT EXIST respond with a message and return from the function */
  if (!rows.length) {
    return res.json({ message: `Could NOT find the user ${user}.` });
  }

  const { rowCount } =
    await sql`INSERT INTO notes (CONTENT, CATEGORY, "userId") VALUES (${content},${category},${rows[0].id})`;

  if (rowCount) {
    res.json({
      message: `A new note with content = ${content} and category = ${category} was added.`,
    });
  } else {
    res.json({
      message: `Note could NOT be created.`,
    });
  }
});

/* DONE ✅
  - [x] change route to something like "/:user/notes/:id"
  - [x] check if user exists
  - [x] delete the individual note by that user
  - [x] return a success/failure message
*/
app.delete("/:user/notes/:id", async (req, res) => {
  const { user, id } = req.params;

  try {
    const { rowCount } = await sql`
        DELETE FROM notes
        WHERE id = ${id} AND "userId" = (
          SELECT id FROM users WHERE UPPER(name) = UPPER(${user})
        )
      `;

    if (rowCount > 0) {
      res.json({ message: `Note with ID ${id} successfully deleted.` });
    } else {
      res.json({ message: `Note with ID ${id} not found.` });
    }
  } catch (error) {
    res.json({ message: `Something went wrong. ${error}` });
  }
});

/* DONE ✅
  - [x] change route to something like "/:user/notes/:id"
  - [x] check if user exists
  - [x] update the individual note by that user
  - [x] return a success/failure message
*/
app.patch("/:user/notes/:id", async (req, res) => {
  const { user, id } = req.params;
  const { content, category } = req.body;

  try {
    const { rowCount } = await sql`
        UPDATE notes
        SET content = ${content}, category = ${category}
        WHERE id = ${id} AND "userId" = (
          SELECT id FROM users WHERE UPPER(users.name) = UPPER(${user})
        )
      `;

    if (rowCount > 0) {
      res.send({
        message: `Note with ID ${id} updated successfully for user ${user}.`,
      });
    } else {
      res.send({
        message: `Note with ID ${id} not found or does not belong to user ${user}.`,
      });
    }
  } catch (error) {
    res.send({ message: `Something went wrong. ${error}` });
  }
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
