const mongoose = require('mongoose')
const moment = require('moment')

const wordOfTheDaySchema = mongoose.Schema({
    word: {
        type: String,
        required: true
    },
    createdOn: {
        type: Date,
        default: moment().toDate()
    },
    expiredAt: {
        type: Date,
        default: moment().add(1, 'day').toDate()
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