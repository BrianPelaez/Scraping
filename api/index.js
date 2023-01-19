import { Hono } from "hono";
import leaderboard from "../db/leaderboard.json";
import {serveStatic} from 'hono/serve-static'
const app = new Hono()

app.get('/', (ctx) => {
	return ctx.json([
		{
			endpoint: '/leaderboard',
			description: 'Returns the teams leaderboard'
		}
	])
})

app.get('/leaderboard', (ctx) => {
	return ctx.json(leaderboard)
})

// Devuelve el contenido de la ruta /assets/static/...
app.get('/static/*', serveStatic({root: './'}))

export default app;