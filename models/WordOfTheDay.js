const mongoose = require('mongoose')
const moment = require('moment')

const wordOfTheDaySchema = mongoose.Schema({
    word: {
        type: String,
        required: true
    },
    createdOn: {
        type: Date,
        default: moment().utc()
    },
    expiredAt: {
        type: Date,
        default: moment().utc().endOf('day')
    }
})

wordOfTheDaySchema.statics.deleteWordOfTheDay = async() => {
    const deletedWordOfTheDay = await WordOfTheDay.deleteMany()
    if (!deletedWordOfTheDay) {
        return false
    }
    return true
}

const WordOfTheDay = mongoose.model('WordOfTheDay', wordOfTheDaySchema)
module.exports = WordOfTheDay