import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameShell from '../components/GameShell';
import useTTS from '../hooks/useTTS';
import { playClick } from '../services/sounds';

// Classic free books with built-in text (no external API needed for reliability)
const BUILT_IN_BOOKS = [
  {
    title: 'The Tale of Peter Rabbit',
    author: 'Beatrix Potter',
    emoji: '🐇',
    cover: '🐇🥕🌿',
    color: '#86EFAC',
    pages: [
      'Once upon a time there were four little Rabbits, and their names were Flopsy, Mopsy, Cotton-tail, and Peter.',
      '"Now, my dears," said old Mrs. Rabbit one morning, "you may go into the fields or down the lane, but don\'t go into Mr. McGregor\'s garden."',
      'Flopsy, Mopsy, and Cotton-tail, who were good little bunnies, went down the lane to gather blackberries.',
      'But Peter, who was very naughty, ran straight away to Mr. McGregor\'s garden and squeezed under the gate!',
      'First he ate some lettuces and some French beans, and then he ate some radishes.',
      'And then, feeling rather sick, he went to look for some parsley.',
      'But round the end of a cucumber frame, whom should he meet but Mr. McGregor!',
      'Mr. McGregor was on his hands and knees planting out young cabbages. He jumped up and ran after Peter, waving a rake and calling out "Stop thief!"',
      'Peter was most dreadfully frightened. He rushed all over the garden, for he had forgotten the way back to the gate.',
      'He lost one of his shoes among the cabbages, and the other shoe amongst the potatoes.',
      'After losing them, he ran on four legs and went faster, so that I think he might have got away altogether if he had not run into a gooseberry net.',
      'Peter gave himself up for lost, and shed big tears. But his sobs were overheard by some friendly sparrows, who flew to him in great excitement and implored him to try harder.',
      'Peter tried very hard and at last got free! He ran and ran until he found the gate, slipped underneath, and ran home safely to the big fir tree.',
      'His mother was busy cooking. She wondered what he had done with his clothes. It was the second little jacket and pair of shoes that Peter had lost in a fortnight!',
      'Peter was not very well during the evening. His mother put him to bed, and made some chamomile tea. She gave a dose of it to Peter: "One tablespoonful to be taken at bedtime."',
      'But Flopsy, Mopsy, and Cotton-tail had bread and milk and blackberries for supper. The End! 🐇✨',
    ],
  },
  {
    title: "Aesop's: The Tortoise and the Hare",
    author: 'Aesop',
    emoji: '🐢',
    cover: '🐢🐇🏁',
    color: '#FDE68A',
    pages: [
      'One day, a very fast Hare was bragging about how fast he could run.',
      '"I am the fastest animal in the whole forest!" said the Hare. "No one can beat me!"',
      'A slow Tortoise overheard and said quietly, "I would like to race you."',
      'The Hare laughed and laughed! "You? Race ME? That is the funniest thing I have ever heard!"',
      '"Let\'s race!" said the Tortoise calmly. All the animals gathered to watch.',
      'The Fox said "Ready, set, GO!" and the race began!',
      'The Hare zoomed ahead very quickly. He was so far ahead, he could barely see the Tortoise.',
      '"This is too easy," said the Hare. "I think I\'ll take a little nap." And he lay down under a nice shady tree.',
      'Meanwhile, the Tortoise just kept walking slowly but steadily. Step by step, he did not stop.',
      'The Hare slept and slept. He was having a wonderful dream about winning trophies.',
      'The Tortoise walked past the sleeping Hare! Step by step, closer and closer to the finish line.',
      'Finally the Hare woke up! He saw the Tortoise was almost at the finish! He ran as fast as he could!',
      'But it was too late. The Tortoise crossed the finish line first! All the animals cheered!',
      '"Slow and steady wins the race!" said the happy Tortoise. The End! 🐢✨',
    ],
  },
  {
    title: 'Goldilocks and the Three Bears',
    author: 'Traditional',
    emoji: '🐻',
    cover: '👧🐻🏠',
    color: '#FCA5A5',
    pages: [
      'Once upon a time, there were three bears who lived in a cozy house in the woods. There was a great big Papa Bear, a medium-sized Mama Bear, and a tiny Baby Bear.',
      'One morning, the three bears made porridge for breakfast. "This porridge is too hot!" said Mama Bear. "Let\'s go for a walk while it cools."',
      'While the bears were away, a little girl named Goldilocks came to the house. She knocked on the door, but nobody answered. So she walked right in!',
      'She saw three bowls of porridge on the table. She tasted Papa Bear\'s porridge. "Too hot!" she cried.',
      'Then she tasted Mama Bear\'s porridge. "Too cold!" she said.',
      'Then she tasted Baby Bear\'s porridge. "Mmm, just right!" And she ate it all up!',
      'Then Goldilocks sat in Papa Bear\'s chair. "Too hard!" she said. She sat in Mama Bear\'s chair. "Too soft!"',
      'Then she sat in Baby Bear\'s chair. "Just right!" But she sat so hard that the chair broke all to pieces!',
      'Goldilocks went upstairs to the bedroom. She lay in Papa Bear\'s bed. "Too hard!" She lay in Mama Bear\'s bed. "Too soft!"',
      'Then she lay in Baby Bear\'s bed. "Just right!" And she fell fast asleep.',
      'The three bears came home. "Someone\'s been eating my porridge!" growled Papa Bear. "Someone\'s been eating MY porridge!" said Mama Bear.',
      '"Someone\'s been eating my porridge," cried Baby Bear, "and they ate it ALL UP!"',
      'They went upstairs. "Someone\'s been sleeping in my bed!" cried Baby Bear. "And she\'s STILL THERE!"',
      'Goldilocks woke up, saw the three bears, and ran out of the house as fast as she could! She never came back to the bear\'s house again. The End! 🐻✨',
    ],
  },
  {
    title: 'The Three Little Pigs',
    author: 'Traditional',
    emoji: '🐷',
    cover: '🐷🐷🐷🏠',
    color: '#FCA5A5',
    pages: [
      'Once upon a time, there were three little pigs. They decided to build their own houses.',
      'The first little pig built his house of straw. "This was so easy!" he said, and went off to play.',
      'The second little pig built his house of sticks. "Done already!" he said, and went off to play.',
      'The third little pig worked very hard and built his house of bricks. It took a long time, but it was very strong.',
      'One day, a big bad wolf came along. He went to the straw house first. "Little pig, little pig, let me come in!"',
      '"Not by the hair on my chinny chin chin!" said the first pig.',
      '"Then I\'ll huff, and I\'ll puff, and I\'ll BLOW your house in!" And he did! The straw house fell down!',
      'The first pig ran to his brother\'s house made of sticks. The wolf followed.',
      '"Little pigs, little pigs, let me come in!" said the wolf. "Not by the hair on our chinny chin chins!"',
      'So the wolf huffed, and he puffed, and he BLEW the stick house down too!',
      'Both pigs ran to the brick house. The wolf came and said "Little pigs, let me come in!"',
      '"Not by the hair on our chinny chin chins!" said all three pigs together.',
      'The wolf huffed and puffed and HUFFED AND PUFFED! But the brick house was too strong! He could not blow it down!',
      'The wolf tried to climb down the chimney, but the clever pigs had a pot of hot water waiting! The wolf ran away and never came back!',
      'The three little pigs lived happily ever after in the strong brick house. The End! 🐷✨',
    ],
  },
  {
    title: 'The Ugly Duckling',
    author: 'Hans Christian Andersen',
    emoji: '🦢',
    cover: '🥚🐣🦢',
    color: '#BFDBFE',
    pages: [
      'Once upon a time, a mother duck sat on her nest waiting for her eggs to hatch.',
      'One by one, the little ducklings hatched! They were all yellow and fluffy. But the last egg was very big.',
      'When it finally hatched, out came a strange-looking duckling. He was grey and much bigger than the others.',
      '"What an ugly duckling!" said the other animals. The poor duckling was very sad.',
      'The other ducklings teased him. "You don\'t look like us!" they said. Even the hens pecked at him.',
      'The ugly duckling was so sad that he ran away from the farm.',
      'He wandered alone through the meadows and marshes. Winter came and it was very cold.',
      'A kind old woman took him in, but her cat and hen were mean to him. So he left again.',
      'All winter long, the ugly duckling was cold and alone. But he never gave up.',
      'When spring finally came, the duckling saw some beautiful white birds gliding on the lake.',
      'He swam towards them shyly. "They will surely chase me away, for I am so ugly," he thought.',
      'But when he looked at his reflection in the water, he could not believe his eyes!',
      'He was no longer a grey, ugly duckling. He had grown into a beautiful white swan!',
      'The other swans welcomed him happily. The children on the shore cried, "Look at that beautiful new swan!"',
      'The beautiful swan felt so happy. He had been a swan all along, he just needed time to grow. The End! 🦢✨',
    ],
  },
];

export default function BookReader() {
  const [selectedBook, setSelectedBook] = useState(null);
  const [pageIdx, setPageIdx] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [highlightWord, setHighlightWord] = useState(-1);
  const [apiBooks, setApiBooks] = useState([]);
  const { speak, stop } = useTTS();
  const highlightTimer = useRef(null);

  // Fetch Open Library books
  useEffect(() => {
    const controller = new AbortController();
    fetch('https://openlibrary.org/subjects/childrens_picture_books.json?limit=20', { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (data.works) {
          setApiBooks(data.works.map(w => ({
            title: w.title,
            author: w.authors?.[0]?.name || 'Unknown',
            coverId: w.cover_id,
            key: w.key,
          })));
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const readPage = useCallback((text) => {
    setIsReading(true);
    setHighlightWord(-1);
    const words = text.split(' ');

    // Timer-based word highlighting (~420ms per word)
    let wordIdx = 0;
    clearInterval(highlightTimer.current);
    highlightTimer.current = setInterval(() => {
      setHighlightWord(wordIdx);
      wordIdx++;
      if (wordIdx >= words.length) clearInterval(highlightTimer.current);
    }, 420);

    speak(text, {
      onEnd: () => {
        clearInterval(highlightTimer.current);
        setIsReading(false);
        setHighlightWord(-1);
      },
    });
  }, [speak]);

  const stopReading = () => {
    clearInterval(highlightTimer.current);
    stop();
    setIsReading(false);
    setHighlightWord(-1);
  };

  const goToPage = (dir) => {
    stopReading();
    playClick();
    if (dir === 'next' && pageIdx < selectedBook.pages.length - 1) setPageIdx(p => p + 1);
    if (dir === 'prev' && pageIdx > 0) setPageIdx(p => p - 1);
  };

  const selectBook = (book) => {
    playClick();
    setSelectedBook(book);
    setPageIdx(0);
    stopReading();
    setTimeout(() => speak(`${book.title}`), 300);
  };

  // If reading a book
  if (selectedBook) {
    const page = selectedBook.pages[pageIdx];
    const words = page.split(' ');

    return (
      <GameShell title={selectedBook.title} icon="📖" backTo="/reading-center">
        <div className="h-full flex flex-col items-center justify-center p-4 gap-4">
          {/* Page counter */}
          <div className="text-white/50 text-sm font-display">
            Page {pageIdx + 1} of {selectedBook.pages.length}
          </div>

          {/* Book page */}
          <motion.div
            key={pageIdx}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 flex items-center justify-center max-w-lg w-full"
          >
            <div className="rounded-3xl p-6 sm:p-8 w-full shadow-2xl border-2 border-white/10"
              style={{ backgroundColor: selectedBook.color + '33' }}>
              {/* Decorative emoji */}
              <div className="text-center text-4xl mb-4">{selectedBook.emoji}</div>

              {/* Text with word highlighting */}
              <p className="font-display text-lg sm:text-xl md:text-2xl leading-relaxed text-white text-center">
                {words.map((word, i) => (
                  <span key={i} className={`inline-block mr-1 transition-all duration-150 ${
                    i === highlightWord ? 'text-empy-yellow scale-110 font-bold' : ''
                  }`}>
                    {word}
                  </span>
                ))}
              </p>
            </div>
          </motion.div>

          {/* Controls */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => goToPage('prev')} disabled={pageIdx === 0}
              className="btn btn-circle btn-lg bg-empy-blue/30 border-empy-blue/50 text-white text-2xl disabled:opacity-30">
              ◀
            </motion.button>

            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => isReading ? stopReading() : readPage(page)}
              className={`btn btn-lg font-display gap-2 ${isReading ? 'bg-red-500/30 border-red-400 text-red-200' : 'bg-empy-yellow/30 border-empy-yellow/50 text-white'}`}>
              {isReading ? '🔇 Stop' : '🔊 Read Aloud'}
            </motion.button>

            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => goToPage('next')} disabled={pageIdx === selectedBook.pages.length - 1}
              className="btn btn-circle btn-lg bg-empy-blue/30 border-empy-blue/50 text-white text-2xl disabled:opacity-30">
              ▶
            </motion.button>
          </div>

          <button onClick={() => { setSelectedBook(null); stopReading(); }}
            className="btn btn-sm btn-ghost text-white/40 font-display">📚 Back to Library</button>
        </div>
      </GameShell>
    );
  }

  // Library view
  return (
    <GameShell title="Book Library" icon="📚" backTo="/reading-center">
      <div className="h-full overflow-auto p-4">
        <h2 className="text-xl font-display text-white mb-4">📖 Classic Stories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8">
          {BUILT_IN_BOOKS.map((book, i) => (
            <motion.button key={i} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => selectBook(book)}
              className="rounded-2xl border-2 border-white/20 bg-white/5 hover:bg-white/10 p-3 flex flex-col items-center gap-2 transition-all text-left">
              <div className="text-4xl h-16 flex items-center justify-center rounded-xl w-full"
                style={{ backgroundColor: book.color + '33' }}>
                {book.cover}
              </div>
              <h3 className="text-xs sm:text-sm font-display text-white leading-tight text-center w-full truncate">{book.title}</h3>
              <p className="text-[10px] text-white/50">{book.author}</p>
              <span className="text-[10px] text-empy-pink">{book.pages.length} pages</span>
            </motion.button>
          ))}
        </div>

        {apiBooks.length > 0 && (
          <>
            <h2 className="text-xl font-display text-white mb-4">🌍 Open Library Books</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {apiBooks.map((book, i) => (
                <motion.div key={i} whileHover={{ scale: 1.05 }}
                  className="rounded-2xl border-2 border-white/20 bg-white/5 p-3 flex flex-col items-center gap-2">
                  {book.coverId ? (
                    <img
                      src={`https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg`}
                      alt={book.title}
                      className="h-24 w-auto rounded-lg object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-24 w-16 bg-white/10 rounded-lg flex items-center justify-center text-3xl">📕</div>
                  )}
                  <h3 className="text-xs font-display text-white leading-tight text-center w-full line-clamp-2">{book.title}</h3>
                  <p className="text-[10px] text-white/50 truncate w-full text-center">{book.author}</p>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </GameShell>
  );
}
