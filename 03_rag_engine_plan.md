# Module 3 — RAG Engine

## Overview
Retrieval-Augmented Generation (RAG) stores knowledge documents in MongoDB and retrieves relevant chunks
before every AI call to inject accurate context into responses.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Document Store | MongoDB (Mongoose) |
| Retrieval | Keyword TF-IDF scoring (simple) |
| Embeddings (bonus) | Groq / sentence-transformers |
| Used by | Chat module, Quiz module |

---

## Folder Structure

```
/server
  /rag
    retriever.js          ← main retrieve(query) function
    seeder.js             ← script to load docs into MongoDB
    /documents
      math.json
      science.json
      history.json
      coding.json
      english.json
  /models
    Document.js           ← MongoDB schema for documents
```

---

## Step 1 — MongoDB Document Model

**File:** `server/models/Document.js`

```js
const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  topic:   { type: String, required: true, index: true },
  title:   { type: String, required: true },
  content: { type: String, required: true },
  tags:    [String]
});

// Text index for full-text search
documentSchema.index({ content: 'text', title: 'text', tags: 'text' });

module.exports = mongoose.model('Document', documentSchema);
```

---

## Step 2 — Knowledge Documents (JSON)

**File:** `server/rag/documents/math.json`

```json
[
  {
    "topic": "Mathematics",
    "title": "Algebra Basics",
    "tags": ["algebra", "equations", "variables"],
    "content": "Algebra is a branch of mathematics dealing with symbols and rules for manipulating those symbols. Variables like x and y represent unknown values. Linear equations (ax + b = 0) have one solution. Quadratic equations (ax² + bx + c = 0) are solved using the quadratic formula: x = (-b ± √(b²-4ac)) / 2a."
  },
  {
    "topic": "Mathematics",
    "title": "Geometry Fundamentals",
    "tags": ["geometry", "shapes", "area", "volume"],
    "content": "Geometry studies shapes, sizes, and properties of figures. Key formulas: Area of circle = πr². Area of triangle = (base × height) / 2. Pythagorean theorem: a² + b² = c² for right triangles. Volume of a sphere = (4/3)πr³. Volume of a cylinder = πr²h."
  },
  {
    "topic": "Mathematics",
    "title": "Calculus Introduction",
    "tags": ["calculus", "derivatives", "integrals", "limits"],
    "content": "Calculus is the study of continuous change. Derivatives measure the rate of change: d/dx(xⁿ) = nxⁿ⁻¹. Integrals measure accumulated change. The Fundamental Theorem of Calculus links differentiation and integration. Limits describe the value a function approaches as input approaches a point."
  }
]
```

**File:** `server/rag/documents/science.json`

```json
[
  {
    "topic": "Science",
    "title": "Photosynthesis",
    "tags": ["biology", "plants", "photosynthesis", "chlorophyll"],
    "content": "Photosynthesis is the process by which green plants convert sunlight into food. The equation is: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂. It occurs in chloroplasts using chlorophyll. The light-dependent reaction produces ATP and NADPH. The Calvin cycle (light-independent) uses these to produce glucose."
  },
  {
    "topic": "Science",
    "title": "Newton's Laws of Motion",
    "tags": ["physics", "newton", "force", "motion"],
    "content": "Newton's First Law: An object stays at rest or in motion unless acted on by a force (inertia). Second Law: Force = Mass × Acceleration (F = ma). Third Law: For every action there is an equal and opposite reaction. These laws form the foundation of classical mechanics."
  },
  {
    "topic": "Science",
    "title": "Periodic Table and Atomic Structure",
    "tags": ["chemistry", "atoms", "periodic table", "elements"],
    "content": "Atoms consist of protons, neutrons (in the nucleus), and electrons (orbiting shells). Atomic number = number of protons. Elements are arranged in the periodic table by atomic number. Groups (columns) share chemical properties. Periods (rows) share the same number of electron shells."
  }
]
```

**File:** `server/rag/documents/history.json`

```json
[
  {
    "topic": "History",
    "title": "World War II Overview",
    "tags": ["world war 2", "WWII", "1939", "1945", "allies"],
    "content": "World War II (1939–1945) was a global conflict between the Allies (USA, UK, USSR, France) and the Axis powers (Germany, Italy, Japan). It began with Germany's invasion of Poland. Key events include the Holocaust, Battle of Britain, Pearl Harbor (1941), D-Day (1944), and atomic bombings of Hiroshima and Nagasaki (1945). It ended with Axis surrender."
  },
  {
    "topic": "History",
    "title": "The French Revolution",
    "tags": ["french revolution", "1789", "france", "monarchy"],
    "content": "The French Revolution (1789–1799) overthrew the French monarchy and established democratic ideals of liberty, equality, and fraternity. Key causes: financial crisis, Enlightenment ideas, social inequality. Events: storming of the Bastille, Declaration of the Rights of Man, Reign of Terror, rise of Napoleon Bonaparte."
  }
]
```

**File:** `server/rag/documents/coding.json`

```json
[
  {
    "topic": "Coding",
    "title": "JavaScript Fundamentals",
    "tags": ["javascript", "programming", "variables", "functions"],
    "content": "JavaScript is a dynamic scripting language for the web. Key concepts: variables (let, const, var), data types (string, number, boolean, array, object), functions (regular and arrow functions), promises and async/await for asynchronous code, DOM manipulation, and event listeners."
  },
  {
    "topic": "Coding",
    "title": "Data Structures Overview",
    "tags": ["data structures", "arrays", "linked lists", "trees", "graphs"],
    "content": "Common data structures: Arrays (ordered list, O(1) access), Linked Lists (dynamic size, O(n) access), Stacks (LIFO), Queues (FIFO), Hash Maps (key-value, O(1) average), Trees (hierarchical, BST for sorted data), Graphs (nodes + edges, used for networks). Choosing the right structure is key to efficient algorithms."
  }
]
```

**File:** `server/rag/documents/english.json`

```json
[
  {
    "topic": "English",
    "title": "Essay Writing Structure",
    "tags": ["essay", "writing", "paragraph", "thesis"],
    "content": "A strong essay has three parts: Introduction (hook, background, thesis statement), Body Paragraphs (topic sentence, evidence, analysis, transition), and Conclusion (restate thesis, summarize key points, closing thought). Each body paragraph should cover one main idea supported by evidence."
  },
  {
    "topic": "English",
    "title": "Grammar Essentials",
    "tags": ["grammar", "nouns", "verbs", "tenses", "punctuation"],
    "content": "Parts of speech: Noun (person, place, thing), Verb (action or state), Adjective (modifies noun), Adverb (modifies verb/adjective), Pronoun (replaces noun), Preposition (shows relationship). Tenses: Simple (I eat), Continuous (I am eating), Perfect (I have eaten). Punctuation: comma, semicolon, colon, apostrophe."
  }
]
```

---

## Step 3 — Database Seeder Script

**File:** `server/rag/seeder.js`

```js
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Document = require('../models/Document');
const fs       = require('fs');
const path     = require('path');

const docFiles = ['math.json', 'science.json', 'history.json', 'coding.json', 'english.json'];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await Document.deleteMany({});
  console.log('Cleared existing documents');

  for (const file of docFiles) {
    const filePath = path.join(__dirname, 'documents', file);
    const docs     = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    await Document.insertMany(docs);
    console.log(`Seeded ${docs.length} docs from ${file}`);
  }

  console.log('Seeding complete!');
  await mongoose.disconnect();
}

seed().catch(console.error);
```

**Run it once:**
```bash
node server/rag/seeder.js
```

---

## Step 4 — Retriever (Core RAG Logic)

**File:** `server/rag/retriever.js`

```js
const Document = require('../models/Document');

/**
 * retrieve(query) → returns a context string of the most relevant document chunks
 */
async function retrieve(query) {
  if (!query || query.trim().length === 0) return '';

  try {
    // Strategy 1: MongoDB full-text search (uses the text index)
    const results = await Document.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' }, content: 1, title: 1, topic: 1 }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(3);

    if (results.length > 0) {
      return formatContext(results);
    }

    // Strategy 2: Fallback — keyword match with regex
    const keywords = extractKeywords(query);
    const regex    = new RegExp(keywords.join('|'), 'i');
    const fallback = await Document.find({
      $or: [
        { content: regex },
        { title:   regex },
        { tags:    { $in: keywords } }
      ]
    }).limit(3);

    return fallback.length > 0 ? formatContext(fallback) : '';
  } catch (err) {
    console.error('RAG retrieval error:', err);
    return '';
  }
}

function formatContext(docs) {
  return docs.map(doc =>
    `[${doc.topic} — ${doc.title}]\n${doc.content}`
  ).join('\n\n---\n\n');
}

function extractKeywords(query) {
  const stopWords = new Set(['what','is','are','how','the','a','an','of','in','to','and','for','with']);
  return query
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .split(' ')
    .filter(w => w.length > 2 && !stopWords.has(w));
}

module.exports = retrieve;
```

---

## Step 5 — How Retriever Is Used in Chat/Quiz Routes

```js
// In server/routes/chat.js or server/routes/quiz.js:
const retrieve = require('../rag/retriever');

// Before calling Groq:
const ragContext = await retrieve(userQuery);

// Inject into system prompt:
const systemPrompt = `
You are an AI tutor. Use this context to answer accurately:

${ragContext || 'No specific context found — answer from general knowledge.'}

Student question: ${userQuery}
`;
```

---

## Optional Upgrade — Semantic Similarity (Bonus)

For smarter retrieval without ML servers, implement basic TF-IDF scoring in memory:

**File:** `server/rag/tfidf.js`

```js
function tfidf(query, documents) {
  const queryTerms = query.toLowerCase().split(/\s+/);

  return documents.map(doc => {
    const docTerms  = doc.content.toLowerCase().split(/\s+/);
    const docLength = docTerms.length;

    let score = 0;
    for (const term of queryTerms) {
      const tf  = docTerms.filter(t => t === term).length / docLength;
      const idf = Math.log(documents.length / (1 + documents.filter(d =>
        d.content.toLowerCase().includes(term)).length));
      score += tf * idf;
    }
    return { ...doc, score };
  }).sort((a, b) => b.score - a.score).slice(0, 3);
}

module.exports = tfidf;
```

---

## NPM Packages

```bash
# No extra packages needed — uses mongoose text index built into MongoDB
```

---

## MongoDB Text Index

The text index is automatically created by Mongoose when you define:
```js
documentSchema.index({ content: 'text', title: 'text', tags: 'text' });
```

This enables `$text: { $search: query }` — MongoDB's built-in full-text search.

---

## Checklist

- [ ] Document.js model with text index created
- [ ] All 5 JSON topic files written (10+ total documents)
- [ ] seeder.js runs and inserts docs into MongoDB
- [ ] retriever.js has both text-search and regex fallback
- [ ] retrieve() is exported and used in chat.js and quiz.js
- [ ] Context correctly injected into AI system prompt
- [ ] Empty context handled gracefully (no crash)
