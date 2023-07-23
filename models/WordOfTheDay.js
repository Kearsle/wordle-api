const mongoose = require('mongoose')
const moment = require('moment')
const { ObjectId } = require('mongodb')

const wordOfTheDaySchema = mongoose.Schema({
    word: {
        type: String,
        required: true
    },
    wordlistTitle: {
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

wordOfTheDaySchema.statics.deleteWordOfTheDay = async(wordlistTitle) => {
    const deletedWordOfTheDay = await WordOfTheDay.deleteMany(wordlistTitle: wordlistTitle)
    if (!deletedWordOfTheDay) {
        return false
    }
    return true
}

wordOfTheDaySchema.statics.checkWordOfTheDay = async(wordlistTitle) => {
    const wordOfTheDay = await WordOfTheDay.findOne(expiredAt: {
        moment().utc() < 
    })
}

const WordOfTheDay = mongoose.model('WordOfTheDay', wordOfTheDaySchema)
module.exports = WordOfTheDay