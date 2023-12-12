const { Client } = require('pg');
const {
  users,
} = require("./db-data.js");
const bcrypt = require("bcrypt");


async function seedUsers(client) {
  try {
    await client.connect()
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create the "users" table if it doesn't exist
    const createTable = await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `);

    console.log(`Created "users" table`);

    // Insert data into the "users" table
    const insertedUsers = await Promise.all(
      users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 18);

        return client.query(`
          INSERT INTO users (id, name, email, password)
          VALUES (uuid_generate_v4(), '${user.name}', '${user.email}', '${hashedPassword}')
          ON CONFLICT (id) DO NOTHING;
        `)
      })
    )

    return {
      createTable,
      users: insertedUsers,
    };

  } catch (error) {
    console.error("Error seeding users:", error);
    throw error;
  }
}

async function main() {
  const client = new Client()

  await seedUsers(client);

  await client.end();
}

main().catch((err) => {
  console.error(
    "An error occurred while attempting to seed the database:",
    err,
  );
});

