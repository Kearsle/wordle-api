const port = process.env.PORT
const express = require('express')
const userRouter = require('./routers/user')
const app = express()
require('./db/db')

app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use(userRouter)

app.listen(port, () => {
	console.log(`Server running on port ${port}`)
})
