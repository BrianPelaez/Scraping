import * as cheerio from "cheerio";
import { writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import fetch from "node-fetch";

//import TEAMS from '../db/team.json' assert { type: "json" };

const DB_PATH = path.join(process.cwd(), "./db/");
const TEAMS = await readFile(`${DB_PATH}/teams.json`, "utf-8").then(JSON.parse);

const URLS = {
  leaderboard: "https://kingsleague.pro/estadisticas/clasificacion/",
  ligaArgentina:
    "https://www.tycsports.com/estadisticas/liga-profesional-de-futbol/tabla-de-posiciones.html",
};

const getTeamFrom = ({ name }) => TEAMS.find((team) => team.name == name);

const scrape = async (url) => {
  const res = await fetch(url);
  const html = await res.text();
  //console.log(TEAMS)
  //console.log(html)
  return cheerio.load(html);
};

const getLeaderBoard = async () => {
  const $ = await scrape(URLS.leaderboard);
  const $rows = $("table tbody tr"); // Filas donde se encuentran los datos.

  const LEADERBOARD_SELECTORS = {
    // Clases de donde sacar los datos.
    team: { selector: ".fs-table-text_3", typeOf: "string" },
    wins: { selector: ".fs-table-text_4", typeOf: "number" },
    loses: { selector: ".fs-table-text_5", typeOf: "number" },
    scoredGoals: { selector: ".fs-table-text_6", typeOf: "number" },
    concededGoals: { selector: ".fs-table-text_7", typeOf: "number" },
    yellowCards: { selector: ".fs-table-text_8", typeOf: "number" },
    redCards: { selector: ".fs-table-text_9", typeOf: "number" },
  };

  const cleanText = (text) =>
    text.replace(/\t|\n|\s:/g, "").replace(/.*:/g, "");

  let leaderboard = [];
  $rows.each((index, el) => {
    const leaderBoardEntries = Object.entries(LEADERBOARD_SELECTORS).map(
      ([key, { selector, typeOf }]) => {
        const rawValue = $(el).find(selector).text();
        const cleanedValue = cleanText(rawValue);

        const value = typeOf === "number" ? Number(cleanedValue) : cleanedValue;
        return [key, value];
      }
    );

    const { team: teamName, ...leaderboardForTeam } =
      Object.fromEntries(leaderBoardEntries);
    const team = getTeamFrom({ name: teamName });
      
    leaderboard.push({ ...leaderboardForTeam, team });
  });
  return leaderboard;
};

const leaderboard = await getLeaderBoard();

await writeFile(
  `${DB_PATH}/leaderboard.json`,
  JSON.stringify(leaderboard, null, 2),
  "utf-8"
);
