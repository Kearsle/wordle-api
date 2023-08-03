const mongoose = require("mongoose");
const moment = require("moment");
const { ObjectId } = require("mongodb");

const guessesSchema = mongoose.Schema({
  guesses: [
    {
      word: {
        type: String,
        required: true,
        minLength: 5,
        maxLength: 5,
      },
    },
  ],
  guessesColour: [
    {
      colours: [],
    },
  ],
  won: {
    type: Boolean,
    default: false,
  },
  wordlistTitle: {
    type: String,
    required: true,
  },
  userID: {
    type: ObjectId,
    required: true,
  },
  createdOn: {
    type: Date,
    default: moment().utc(),
  },
  expiredAt: {
    type: Date,
    default: moment().utc().endOf("day"),
  },
});

guessesSchema.statics.checkGuessStore = async (userID, wordlistTitle) => {
  const guesses = await Guesses.findOne({
    userID: userID,
    wordlistTitle: wordlistTitle,
    expiredAt: { $gt: moment().utc() },
  });
  if (guesses) {
    return true;
  } else {
    return false;
  }
};

guessesSchema.statics.addGuess = async (
  guess,
  userID,
  wordlistTitle,
  won,
  colourArray
) => {
  try {
    const guesses = await Guesses.findOne({
      userID: userID,
      wordlistTitle: wordlistTitle,
      expiredAt: { $gt: moment().utc() },
    });
    if (guesses.guesses.length >= 6 || guesses.won) {
      return false;
    }
    await Guesses.updateOne(
      {
        userID: userID,
        wordlistTitle: wordlistTitle,
        expiredAt: { $gt: moment().utc() },
      },
      { $push: { guessesColour: { colours: colourArray } }, won: won }
    );
    await Guesses.updateOne(
      {
        userID: userID,
        wordlistTitle: wordlistTitle,
        expiredAt: { $gt: moment().utc() },
      },
      { $push: { guesses: { word: guess } } }
    );
  } catch (error) {
    return false;
  }
  return true;
};

guessesSchema.statics.gameInit = async (wordlistTitle, userID) => {
  try {
    const guesses = await Guesses.findOne({
      userID: userID,
      wordlistTitle: wordlistTitle,
      expiredAt: { $gt: moment().utc() },
    });
    if (!guesses) {
      return null;
    }
    // guesses ["word", "wodasd"]
    const guessesArray = [];
    var guessesArrayBlankSpace = 6;
    guesses.guesses.forEach((guess) => {
      guessesArray.push(guess.word);
      guessesArrayBlankSpace -= 1;
    });
    for (let i = 0; i < guessesArrayBlankSpace; i++) {
      guessesArray.push("");
    }
    // guesses res [["g","g","g","g","g"]]
    const guessesColoursArray = [];
    guesses.guessesColour.forEach((guess) => {
      guessesColoursArray.push(guess.colours);
    });
    // current guess
    const currentGuess = guesses.guesses.length;
    // won
    const won = guesses.won;
    // game over
    const gameOver = won || currentGuess > 5;
    return {
      guesses: guessesArray,
      guessesRes: guessesColoursArray,
      currentGuess: currentGuess,
      gameOver: gameOver,
      won: won,
    };
  } catch (error) {
    console.log(error);
    return null;
  }
};

const Guesses = mongoose.model("Guesses", guessesSchema);
module.exports = Guesses;
