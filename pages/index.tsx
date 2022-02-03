import { useState, useEffect } from "react";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";

const WORDS_URL =
  "https://gist.githubusercontent.com/zneak/53f885f1fc5856741cb4/raw/a17a81d15acb8109cda8524c743186901dd269b6/words.txt";

export async function getStaticProps() {
  const res = await fetch(WORDS_URL);
  const words = await res.text();
  const wordList = words.split("\n").filter((word) => word.length === 5);
  const word = wordList[Math.floor(Math.random() * wordList.length)];

  return {
    props: {
      word,
      wordList,
    },
    revalidate: 5 * 60,
  };
}

const getHammingDistance = (str1 = "", str2 = "") => {
  if (str1.length !== str2.length) {
    return 0;
  }
  let dist = 0;
  for (let i = 0; i < str1.length; i += 1) {
    if (str1[i] !== str2[i]) {
      dist += 1;
    }
  }
  return dist;
};

const Home = ({
  word,
  wordList,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  const [pendingBoard, setPendingBoardState] = useState([
    "     ",
    "     ",
    "     ",
    "     ",
    "     ",
  ]);
  const [guessState, setGuessState] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("     ");
  const [hammingDistance, setHammingDistance] = useState(-1);
  const [wordInList, setWordInList] = useState(true);
  const [guessDistances, setGuessDistances] = useState([
    -1, -1, -1, -1, -1, -1,
  ]);

  useEffect(() => {
    function handleSubmit() {
      if (guessState.length === 6 || currentGuess.includes(" ")) return;
      if (!wordList.includes(currentGuess)) {
        setWordInList(false);
        return;
      }
      setWordInList(true);
      const distance = getHammingDistance(currentGuess, word);
      if (distance === 0) {
        setHammingDistance(0);
        const index = guessDistances.indexOf(-1);
        const nextGuessDistances = [...guessDistances];
        nextGuessDistances[index] = distance;
        setGuessDistances(nextGuessDistances);
        return;
      }
      const nextGuessState = [...guessState];
      nextGuessState.push(currentGuess);
      setGuessState(nextGuessState);
      setHammingDistance(distance);
      const index = guessDistances.indexOf(-1);
      const nextGuessDistances = [...guessDistances];
      nextGuessDistances[index] = distance;
      setGuessDistances(nextGuessDistances);
      setPendingBoardState([...pendingBoard].slice(0, pendingBoard.length - 1));
      setCurrentGuess("     ");
    }
    const onKeyPress = (e: Event) => {
      if (!(e instanceof KeyboardEvent)) return;
      const key = e.key;
      const firstSpaceLocation = currentGuess.indexOf(" ");
      if (key === "Enter" && firstSpaceLocation === -1) handleSubmit();
      if (key === "Backspace") {
        if (firstSpaceLocation === 0) return;
        if (firstSpaceLocation === -1) {
          setCurrentGuess(currentGuess.slice(0, 4) + " ");
          return;
        }
        setCurrentGuess(
          currentGuess.slice(0, firstSpaceLocation - 1) +
            " ".repeat(6 - firstSpaceLocation)
        );
      }
      if (
        firstSpaceLocation === 5 ||
        firstSpaceLocation === -1 ||
        key.length > 1
      )
        return;
      setCurrentGuess(
        currentGuess.slice(0, firstSpaceLocation) +
          e.key.toLowerCase() +
          " ".repeat(4 - firstSpaceLocation)
      );
    };
    document.addEventListener("keydown", onKeyPress);
    return () => document.removeEventListener("keydown", onKeyPress);
  }, [currentGuess, guessState, pendingBoard, word, wordList, guessDistances]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Hammingdle</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <section>
          <div className={styles.board}>
            {guessState.map((row, index) => (
              <div
                key={Math.random()}
                className={`${styles.row} ${styles.filled}`}
              >
                {row.split("").map((letter) => (
                  <div
                    key={Math.random()}
                    className={styles.tile}
                    data-state={`${guessDistances[index]}`}
                  >
                    {letter}
                  </div>
                ))}
              </div>
            ))}
            {guessState.length !== 6 && (
              <div className={styles.row}>
                {currentGuess.split("").map((letter) => (
                  <div
                    key={Math.random()}
                    className={styles.tile}
                    data-state={letter === " " ? "empty" : "tbd"}
                  >
                    {letter}
                  </div>
                ))}
              </div>
            )}
            {pendingBoard.map((row) => (
              <div key={Math.random()} className={styles.row}>
                {row.split("").map((letter) => (
                  <div
                    key={Math.random()}
                    className={styles.tile}
                    data-state={"empty"}
                  >
                    {letter}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
        {hammingDistance !== -1 && (
          <p className={styles.description}>
            Hamming distance of last guess: {hammingDistance}
          </p>
        )}
        {!wordInList && <p className={styles.description}>Word not in list</p>}
      </main>
    </div>
  );
};

export default Home;
