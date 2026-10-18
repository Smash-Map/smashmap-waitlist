// node env.mjs — écrit env.js depuis .env (à côté de ce fichier).
// Une variable déjà définie dans l'environnement gagne (build Netlify).
// Sans URL ni clé, env.js reste vide : le site tourne en mode démo.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const dir = new URL(".", import.meta.url);
const file = new URL(".env", dir);
const fromFile = {};
if (existsSync(file)) {
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (match) fromFile[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

const read = (key) => process.env[key] || fromFile[key] || "";
const env = {
  SUPABASE_URL: read("SUPABASE_URL").replace(/\/+$/, ""),
  SUPABASE_ANON_KEY: read("SUPABASE_ANON_KEY"),
};
if (env.SUPABASE_URL && !/^https:\/\/[^/]+$/.test(env.SUPABASE_URL)) {
  throw new Error(`SUPABASE_URL doit être l'URL du projet (https://xxxx.supabase.co), pas « ${env.SUPABASE_URL} ».`);
}

writeFileSync(new URL("env.js", dir), `window.SMASHMAP_ENV = ${JSON.stringify(env, null, 2)};\n`);
console.log(env.SUPABASE_URL && env.SUPABASE_ANON_KEY ? `env.js → ${env.SUPABASE_URL}` : "env.js vide → mode démo");
