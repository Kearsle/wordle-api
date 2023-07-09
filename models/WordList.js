const mongoose = require("mongoose")

const wordlistSchema = mongoose.Schema({
    title: {
      type: String,
      unique: true,
      minLength: 3,
      required: true,
      trim: true
    },
    words: [
      {
        word: {
          type: String,
          minLength: 5,
          maxLength: 5,
          required: true
        },
      },
    ],
})

wordlistSchema.statics.addWord = async (wordlistTitle, word) => {
    // is the word 5 characters long
    if (word.length != 5) {
      return false
    }

    // Is the wordlist title correct and word is unique
    const wordlist = await WordList.findOne({ title: wordlistTitle, 'words.word': { $ne: word } })
    if (!wordlist) {
        return false
    }

    // Add word
    try {
      await WordList.updateOne(
        { title: wordlistTitle },
        { $push: { words: { word: word.toLowerCase() } } }
      )
      return true
    } catch (error) {
      return false
    }
  }

wordlistSchema.statics.getRandomWord = async (wordlistTitle) => {
  const wordlist = await WordList.findOne({title : wordlistTitle})
  if (!wordlist) {
    return null
  }
  const num = Math.floor(Math.random() * wordlist.words.length)
  const word = wordlist.words[num].word
  return(word)
}

const WordList = mongoose.model("WordList", wordlistSchema)
module.exports = WordList


