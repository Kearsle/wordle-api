const jwt = require('jsonwebtoken')

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

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

module.exports = {
    authenticateToken
}