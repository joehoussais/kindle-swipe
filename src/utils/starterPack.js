/**
 * Starter pack of classic quotes for new users
 */

export const STARTER_QUOTES = [
  { text: "The unexamined life is not worth living.", author: "Plato", title: "Apology" },
  { text: "Justice means minding your own business and not meddling.", author: "Plato", title: "Republic" },
  { text: "Love is a serious mental disease.", author: "Plato", title: "Symposium" },
  { text: "I know that I know nothing.", author: "Plato", title: "Apology" },
  { text: "We are what we repeatedly do.", author: "Aristotle", title: "Nicomachean Ethics" },
  { text: "You have power over your mind - not outside events.", author: "Marcus Aurelius", title: "Meditations" },
  { text: "It's not things that upset us, but our judgments.", author: "Epictetus", title: "Enchiridion" },
  { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca", title: "Letters" },
  { text: "My life has been full of terrible misfortunes, most never happened.", author: "Montaigne", title: "Essays" },
  { text: "There is nothing either good or bad, but thinking makes it so.", author: "Shakespeare", title: "Hamlet" },
  { text: "All the world's a stage, and all the men and women merely players.", author: "Shakespeare", title: "As You Like It" },
  { text: "Bear up, my heart; you've borne worse before.", author: "Homer", title: "Odyssey" },
  { text: "Perhaps one day it will be pleasing to remember even these things.", author: "Virgil", title: "Aeneid" },
  { text: "Abandon all hope, you who enter here.", author: "Dante", title: "Inferno" },
  { text: "There is no charm equal to tenderness of heart.", author: "Jane Austen", title: "Pride and Prejudice" },
  { text: "It was the best of times, it was the worst of times.", author: "Charles Dickens", title: "A Tale of Two Cities" },
  { text: "All happy families are alike; each unhappy family is unhappy.", author: "Leo Tolstoy", title: "Anna Karenina" },
  { text: "If God does not exist, everything is permitted.", author: "Fyodor Dostoevsky", title: "The Brothers Karamazov" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche", title: "Zarathustra" },
  { text: "Life can only be understood backwards; but lived forwards.", author: "Søren Kierkegaard", title: "Journals" },
  { text: "I think, therefore I am.", author: "René Descartes", title: "Discourse on Method" },
  { text: "The more we understand, the more we love.", author: "Baruch Spinoza", title: "Ethics" },
  { text: "Reason is, and ought only to be, the slave of the passions.", author: "David Hume", title: "Enquiry" },
  { text: "Act only on that maxim you can will as a universal law.", author: "Immanuel Kant", title: "Groundwork" },
  { text: "Compassion is the basis of morality.", author: "Arthur Schopenhauer", title: "Essays" },
  { text: "The struggle itself toward the heights is enough to fill a heart.", author: "Albert Camus", title: "Myth of Sisyphus" },
  { text: "In the middle of winter, I found within me an invincible summer.", author: "Albert Camus", title: "Return to Tipasa" },
  { text: "The only way to fight the plague is with decency.", author: "Albert Camus", title: "The Plague" },
  { text: "If you want a picture of the future, imagine a boot on a face.", author: "George Orwell", title: "1984" },
  { text: "Ending is better than mending.", author: "Aldous Huxley", title: "Brave New World" },
  { text: "Someone must have slandered Josef K.", author: "Franz Kafka", title: "The Trial" },
  { text: "Hell is other people.", author: "Jean-Paul Sartre", title: "No Exit" },
  { text: "Nothing happens, nobody comes, nobody goes, it's awful.", author: "Samuel Beckett", title: "Godot" },
  { text: "What is the meaning of life? That was all - a simple question.", author: "Virginia Woolf", title: "To the Lighthouse" },
  { text: "Isn't it pretty to think so?", author: "Ernest Hemingway", title: "The Sun Also Rises" },
  { text: "So we beat on, boats against the current.", author: "F. Scott Fitzgerald", title: "The Great Gatsby" },
  { text: "And now that you don't have to be perfect, you can be good.", author: "John Steinbeck", title: "East of Eden" },
  { text: "The only thing that makes life possible is permanent uncertainty.", author: "Ursula K. Le Guin", title: "The Left Hand of Darkness" },
  { text: "Nolite te bastardes carborundorum.", author: "Margaret Atwood", title: "The Handmaid's Tale" },
  { text: "Not all those who wander are lost.", author: "J.R.R. Tolkien", title: "The Fellowship of the Ring" },
  { text: "Fear is the mind-killer.", author: "Frank Herbert", title: "Dune" },
  { text: "Don't ever tell anybody anything.", author: "J.D. Salinger", title: "The Catcher in the Rye" },
  { text: "Love takes off the masks we fear we cannot live without.", author: "James Baldwin", title: "The Fire Next Time" },
  { text: "Freeing yourself was one thing; claiming ownership was another.", author: "Toni Morrison", title: "Beloved" },
  { text: "The real voyage is having new eyes.", author: "Marcel Proust", title: "Swann's Way" },
  { text: "Problems are inevitable; our ability to solve them is not.", author: "David Deutsch", title: "The Beginning of Infinity" },
  { text: "The multiverse is not other worlds; it is physics.", author: "David Deutsch", title: "The Fabric of Reality" },
  { text: "Those who have a 'why' can bear almost any 'how'.", author: "Viktor Frankl", title: "Man's Search for Meaning" },
  { text: "Beware; for I am fearless, and therefore powerful.", author: "Mary Shelley", title: "Frankenstein" },
  { text: "The proof of the pudding is in the eating.", author: "Miguel de Cervantes", title: "Don Quixote" }
];

/**
 * Generate highlight objects from starter quotes
 */
export function generateStarterHighlights() {
  return STARTER_QUOTES.map((quote, index) => ({
    id: `starter-${index}-${quote.text.slice(0, 20).replace(/\W/g, '')}`,
    text: quote.text,
    title: quote.title,
    author: quote.author,
    location: null,
    page: null,
    isStarter: true
  }));
}
