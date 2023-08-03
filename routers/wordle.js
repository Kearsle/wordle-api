const express = require("express");
const router = express.Router();
const Wordle = require("../models/Wordle");
const WordList = require("../models/WordList");
const WordOfTheDay = require("../models/WordOfTheDay");
const auth = require("../middleware/auth");
const fs = require("fs");
const { error } = require("console");
const Guesses = require("../models/Guesses");

module.exports = router;

router.get("/wordle", async (req, res) => {
  console.log("Status 200: Ping");
  res.status(200).send({ message: "pong" });
});

// Wordlist
router.post(
  "/wordle/wordlist/create",
  auth.authenticateToken,
  auth.isAdmin,
  async (req, res) => {
    try {
      const wordlist = new WordList(req.body);
      if (!req.body.title) {
        return res
          .status(400)
          .send({ error: "Failed to create a new wordlist!" });
      }
      await wordlist.save();
      console.log(`Status 201: Created a new ${req.body.title}!`);
      res.status(201).send({ success: `${req.body.title} created.` });
    } catch (errors) {
      console.log(errors);
      console.log("Status 400: Failed to create a new wordlist!");
      res.status(400).send({ error: "Failed to create a new wordlist!" });
    }
  }
);

router.post(
  "/wordle/wordlist/addWord",
  auth.authenticateToken,
  auth.isAdmin,
  async (req, res) => {
    const wordlistTitle = req.body.title;
    const word = req.body.word;

    if (wordlistTitle && word) {
      if (await WordList.addWord(wordlistTitle, word)) {
        res.status(201).send({ success: `${word} added to ${wordlistTitle}` });
      } else {
        res.status(400).send({ error: "Failed to add word to the word list!" });
      }
    } else {
      res.status(400).send({ error: "Word list title or word not sent." });
    }
  }
);

router.get("/wordle/wordlists", auth.authenticateToken, async (req, res) => {
  // Return all active wordlists aka active games

  try {
    const wordlists = await WordList.getActiveWordlists();
    if (!wordlists) {
      return res
        .status(401)
        .send({ error: "Failed to find any active wordlists" });
    }
    res.status(200).send(wordlists);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get(
  "/wordle/wordlist/:wordlist",
  auth.authenticateToken,
  async (req, res) => {
    const wordlistID = req.params.wordlist;
    const wordlist = await WordList.getWordlistFromID(wordlistID);
    if (!wordlist) {
      return res.status(404).send({ error: "No wordlist found." });
    }
    res.status(200).send({ title: wordlist.title });
  }
);

// Word of the Day

router.post(
  "/wordle/wordoftheday/new",
  auth.authenticateToken,
  auth.isAdmin,
  async (req, res) => {
    const wordlistTitle = req.body.title;
    const word = await WordList.getRandomWord(wordlistTitle);
    if (!word) {
      return res.status(401).send({ error: "Wordlist is not valid." });
    }
    // delete current word and save new word
    if (!(await WordOfTheDay.deleteWordOfTheDay(wordlistTitle))) {
      return res
        .status(401)
        .send({ error: "Failed to delete current word of the day." });
    }
    try {
      const wordOfTheDay = new WordOfTheDay({ word: word });
      wordOfTheDay.wordlistTitle = wordlistTitle;
      await wordOfTheDay.save();
      console.log("Status 201: New word of the day.");
      res.status(201).send({ success: "New word of the day.", word: word });
    } catch (error) {
      console.log("Status 400: Failed to set new Word of the Day.");
      console.log(error);
      res.status(400).send({ error: "Failed to set new Word of the Day." });
    }
  }
);

// Game
router.post("/wordle/init", auth.authenticateToken, async (req, res) => {
  const wordlistTitle = req.body.wordlistTitle;
  const userID = req.userToken.userID;
  // Check if wordlist is correct
  const wordlist = await WordList.getWordlistFromTitle(wordlistTitle);
  if (!wordlist) {
    return res.status(404).send({ error: "No wordlist found." });
  }
  // wordle init
  const wordleInit = await Guesses.gameInit(wordlistTitle, userID);
  return res.status(200).send({ wordleInit });
});

router.post("/wordle/guess", auth.authenticateToken, async (req, res) => {
  // get guess, return array of b, y or green for each character passed
  const wordlistTitle = req.body.wordlistTitle;
  const userID = req.userToken.userID;
  const guess = req.body.guess;
  // Check if guess is valid
  if (guess.length != 5) {
    return res.status(401).send({ error: "Guess must be 5 characters long" });
  }
  // Check if wordlist is correct
  const wordlist = await WordList.getWordlistFromTitle(wordlistTitle);
  if (!wordlist) {
    return res.status(404).send({ error: "No wordlist found." });
  }
  // Check if a current word of the day is there, if not add one
  if (!(await WordOfTheDay.checkWordOfTheDay(wordlistTitle))) {
    const word = await WordList.getRandomWord(wordlistTitle);
    if (!word) {
      return res.status(401).send({ error: "No words in wordlist." });
    }
    // delete current word and save new word
    if (!(await WordOfTheDay.deleteWordOfTheDay(wordlistTitle))) {
      return res
        .status(401)
        .send({ error: "Failed to delete current word of the day." });
    }
    try {
      const wordOfTheDay = new WordOfTheDay({ word: word });
      wordOfTheDay.wordlistTitle = wordlistTitle;
      await wordOfTheDay.save();
      console.log("Status 201: New word of the day.");
    } catch (error) {
      console.log("Status 400: Failed to set new Word of the Day.");
      res.status(400).send({ error: "Failed to set new Word of the Day." });
    }
  }
  const wordOfTheDay = await WordOfTheDay.getWordOfTheDay(wordlistTitle);
  if (!wordOfTheDay) {
    res.status(400).send({ error: "Failed to submit guess." });
  }
  // Store player guess / create one and store

  if (!(await Guesses.checkGuessStore(userID, wordlistTitle))) {
    // Create guess
    try {
      const guessStore = new Guesses({
        wordlistTitle: wordlistTitle,
        userID: userID,
      });
      await guessStore.save();
      console.log("Created new guess store");
    } catch (error) {
      res.status(400).send({ error: "Failed to submit guess." });
    }
  }

  // Check if won
  var won;
  if (wordOfTheDay.word === guess) {
    won = true;
    console.log("When adding saved progress. Need to stop all if saved.");
  } else {
    won = false;
    console.log(
      "When adding saved progress. Need to increment guesses and save the guesses."
    );
  }

  // decide the colours for each of the guessed letters
  const colourArray = [];
  for (let i = 0; i < guess.length; i++) {
    const guessedLetter = guess[i];
    if (guessedLetter === wordOfTheDay.word[i]) {
      // green
      colourArray[i] = "g";
    } else if (wordOfTheDay.word.includes(guessedLetter)) {
      // yellow
      colourArray[i] = "y";
    } else {
      // black
      colourArray[i] = "b";
    }
  }

  // store guess

  if (
    !(await Guesses.addGuess(guess, userID, wordlistTitle, won, colourArray))
  ) {
    return res.status(400).send({ error: "Game is already over" });
  }

  return res
    .status(200)
    .send({
      success: "word of the day is valid.",
      won: won,
      colourArray: colourArray,
    });
});
