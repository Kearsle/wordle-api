const jwt = require('jsonwebtoken')
const User = require('../models/User')

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    var token = authHeader && authHeader.split(' ')[1]

    if (!token) {
        token = req.cookies.accessToken
    }

    if (!token) {
        return res.status(401).send({error: "No authorization token supplied."})
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, userToken) => {
        if (error) {
            return res.status(403).send({error: "Authorization denied."})
        }
        req.userToken = userToken
        next()
    })
}

async function isAdmin(req, res, next) {
    const userID = req.userToken.userID
    if (!userID) {
        return res.status(400).send({error: "Failed to validate token."})
    }
    const role = await User.getRole(userID)
    if (role == null) {
        return res.status(400).send({error: "Failed to validate token."})
    }
    if (role < 1) {
        return res.status(400).send({error: "You do not have permission to do this action."})
    }
    next()
}

module.exports = {
    authenticateToken,
    isAdmin
}