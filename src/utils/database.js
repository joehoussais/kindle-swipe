// IndexedDB database for user authentication and book tracking

const DB_NAME = 'kindle-swipe-db';
const DB_VERSION = 1;

let db = null;

// Initialize the database
export function initDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Users store - for authentication
      if (!database.objectStoreNames.contains('users')) {
        const usersStore = database.createObjectStore('users', { keyPath: 'email' });
        usersStore.createIndex('email', 'email', { unique: true });
      }

      // Books store - tracks books user has imported
      if (!database.objectStoreNames.contains('books')) {
        const booksStore = database.createObjectStore('books', { keyPath: 'id', autoIncrement: true });
        booksStore.createIndex('userEmail', 'userEmail', { unique: false });
        booksStore.createIndex('bookTitle', 'bookTitle', { unique: false });
        booksStore.createIndex('userBook', ['userEmail', 'bookTitle'], { unique: true });
      }

      // Sessions store - for remember me functionality
      if (!database.objectStoreNames.contains('sessions')) {
        const sessionsStore = database.createObjectStore('sessions', { keyPath: 'token' });
        sessionsStore.createIndex('userEmail', 'userEmail', { unique: false });
      }
    };
  });
}

// Hash password (simple hash for demo - in production use bcrypt on server)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'kindle-swipe-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate session token
function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Register a new user
export async function registerUser(email, password, name) {
  await initDatabase();
  const hashedPassword = await hashPassword(password);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');

    const user = {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      createdAt: new Date().toISOString()
    };

    const request = store.add(user);

    request.onsuccess = () => resolve({ email: user.email, name: user.name });
    request.onerror = () => {
      if (request.error?.name === 'ConstraintError') {
        reject(new Error('Email already registered'));
      } else {
        reject(request.error);
      }
    };
  });
}

// Login user
export async function loginUser(email, password) {
  await initDatabase();
  const hashedPassword = await hashPassword(password);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const request = store.get(email.toLowerCase());

    request.onsuccess = () => {
      const user = request.result;
      if (!user) {
        reject(new Error('User not found'));
      } else if (user.password !== hashedPassword) {
        reject(new Error('Invalid password'));
      } else {
        resolve({ email: user.email, name: user.name });
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// Create session (for remember me)
export async function createSession(userEmail) {
  await initDatabase();
  const token = generateToken();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['sessions'], 'readwrite');
    const store = transaction.objectStore('sessions');

    const session = {
      token,
      userEmail: userEmail.toLowerCase(),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };

    const request = store.add(session);

    request.onsuccess = () => {
      localStorage.setItem('kindle-swipe-session', token);
      resolve(token);
    };
    request.onerror = () => reject(request.error);
  });
}

// Get current session
export async function getCurrentSession() {
  const token = localStorage.getItem('kindle-swipe-session');
  if (!token) return null;

  await initDatabase();

  return new Promise((resolve) => {
    const transaction = db.transaction(['sessions', 'users'], 'readonly');
    const sessionsStore = transaction.objectStore('sessions');
    const request = sessionsStore.get(token);

    request.onsuccess = () => {
      const session = request.result;
      if (!session) {
        localStorage.removeItem('kindle-swipe-session');
        resolve(null);
        return;
      }

      // Check if session expired
      if (new Date(session.expiresAt) < new Date()) {
        localStorage.removeItem('kindle-swipe-session');
        resolve(null);
        return;
      }

      // Get user info
      const usersStore = transaction.objectStore('users');
      const userRequest = usersStore.get(session.userEmail);

      userRequest.onsuccess = () => {
        const user = userRequest.result;
        if (user) {
          resolve({ email: user.email, name: user.name });
        } else {
          resolve(null);
        }
      };
      userRequest.onerror = () => resolve(null);
    };
    request.onerror = () => resolve(null);
  });
}

// Logout - remove session
export async function logout() {
  const token = localStorage.getItem('kindle-swipe-session');
  if (!token) return;

  await initDatabase();
  localStorage.removeItem('kindle-swipe-session');

  return new Promise((resolve) => {
    const transaction = db.transaction(['sessions'], 'readwrite');
    const store = transaction.objectStore('sessions');
    store.delete(token);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => resolve();
  });
}

// Add a book to user's history
export async function addBookToHistory(userEmail, bookTitle, author, highlightCount) {
  await initDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['books'], 'readwrite');
    const store = transaction.objectStore('books');
    const index = store.index('userBook');

    // Check if book already exists for this user
    const getRequest = index.get([userEmail.toLowerCase(), bookTitle]);

    getRequest.onsuccess = () => {
      const existingBook = getRequest.result;

      if (existingBook) {
        // Update existing book
        existingBook.highlightCount = highlightCount;
        existingBook.lastImportedAt = new Date().toISOString();
        const updateRequest = store.put(existingBook);
        updateRequest.onsuccess = () => resolve(existingBook);
        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        // Add new book
        const newBook = {
          userEmail: userEmail.toLowerCase(),
          bookTitle,
          author,
          highlightCount,
          firstImportedAt: new Date().toISOString(),
          lastImportedAt: new Date().toISOString()
        };
        const addRequest = store.add(newBook);
        addRequest.onsuccess = () => resolve({ ...newBook, id: addRequest.result });
        addRequest.onerror = () => reject(addRequest.error);
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// Get all books for a user
export async function getUserBooks(userEmail) {
  await initDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['books'], 'readonly');
    const store = transaction.objectStore('books');
    const index = store.index('userEmail');
    const request = index.getAll(userEmail.toLowerCase());

    request.onsuccess = () => {
      const books = request.result.sort((a, b) =>
        new Date(b.lastImportedAt) - new Date(a.lastImportedAt)
      );
      resolve(books);
    };
    request.onerror = () => reject(request.error);
  });
}

// Get book count for user
export async function getUserBookCount(userEmail) {
  const books = await getUserBooks(userEmail);
  return books.length;
}

// Remove a book from user's history
export async function removeBookFromHistory(userEmail, bookTitle) {
  await initDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['books'], 'readwrite');
    const store = transaction.objectStore('books');
    const index = store.index('userBook');
    const request = index.getKey([userEmail.toLowerCase(), bookTitle]);

    request.onsuccess = () => {
      if (request.result) {
        store.delete(request.result);
      }
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}
