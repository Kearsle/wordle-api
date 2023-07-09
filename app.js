const port = process.env.PORT
const express = require('express')
const userRouter = require('./routers/user')
const wordleRouter = require('./routers/wordle')
const app = express()
require('./db/db')

app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use(userRouter)
app.use(wordleRouter)

app.listen(port, () => {
	console.log(`Server running on port ${port}`)
})
