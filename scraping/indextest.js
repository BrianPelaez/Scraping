import * as cheerio from "cheerio";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import fetch from "node-fetch";

import TEAMS from "../db/team.json"

const URLS = {
  leaderboard: "https://kingsleague.pro/estadisticas/clasificacion/",
  ligaArgentina:
    "https://www.tycsports.com/estadisticas/liga-profesional-de-futbol/tabla-de-posiciones.html",
};

const scrape = async (url) => {
  const res = await fetch(url);
  const html = await res.text();
  //console.log(html)
  return cheerio.load(html);
};

const getLeaderBoard = async () => {
  const $ = await scrape(URLS.ligaArgentina);
  const $rows = $("table tbody tr"); // Filas donde se encuentran los datos.

  const LEADERBOARD_SELECTORS = {
    // Clases de donde sacar los datos.
    team: { selector: ".equipo", typeOf: "string" },
    teamPNG: { selector: ".escudo img", typeOf: "image/png" },
    points: { selector: ".puntos", typeOf: "number" },
    matches:{ selector: "td:nth-child(5)", typeOf: "number" },
    wins: { selector: "td:nth-child(6)", typeOf: "number" },
    draw: { selector: "td:nth-child(7)", typeOf: "number" },
    loses: { selector: "td:nth-child(8)", typeOf: "number" },
    scoredGoals: { selector: "td:nth-child(9)", typeOf: "number" },
    concededGoals: { selector: "td:nth-child(10)", typeOf: "number" },
  };

  const cleanText = (text) => text.trim();

  let leaderboard = [];

  $rows.each((index, el) => {
    const leaderBoardEntries = Object.entries(LEADERBOARD_SELECTORS).map(
      ([key, { selector, typeOf }]) => {
        const rowValue =
          typeOf == "image/png"
            ? $(el).find(selector).attr("src")
            : $(el).find(selector).text();
        const cleanedValue = cleanText(rowValue);
        //console.log(rowValue)
        const value = typeOf === "number" ? Number(cleanedValue) : cleanedValue;

        return [key, value];
      }
    );
    leaderboard.push(Object.fromEntries(leaderBoardEntries));
  });
  console.log(leaderboard);
  return leaderboard;
};

const leaderboard = await getLeaderBoard();
//console.log(leaderboard);

const filePath = path.join(process.cwd(), "./db/leaderboard.json");

await writeFile(filePath, JSON.stringify(leaderboard, null, 2), "utf-8");