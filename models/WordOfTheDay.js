// database, if the lastest one added is a day old then add a new one from the wordlist

// Needs to check if valid word of the day
// Needs add new word of the day

const mongoose = require('mongoose')

const wordOfTheDaySchema = mongoose.Schema({
    word: {
        type: String,
        required: true
    },
    createdOn: {
        type: Date,
        default: Date.now
    },
    expiredAt: {
        type: Date,
        default: Date.now + (24 * 60 * 60 * 1000)
    }
})

const WordOfTheDay = mongoose.model('WordOfTheDay', wordOfTheDaySchema)
module.exports = WordOfTheDay