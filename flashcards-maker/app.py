from flask import Flask, request, jsonify, render_template
import sqlite3
import os
import json
import re
from datetime import datetime
import random

app = Flask(__name__, static_folder='.', static_url_path='')

# Initialize SQLite database
def init_db():
    conn = sqlite3.connect('memorize.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS decks (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            cards TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Helper function for text summarization
def summarize_text(text):
    # Split text into sentences
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    # Score sentences based on word frequency
    word_frequencies = {}
    for sentence in sentences:
        for word in sentence.lower().split():
            if word not in word_frequencies:
                word_frequencies[word] = 1
            else:
                word_frequencies[word] += 1
    
    # Score sentences based on the frequency of their words
    sentence_scores = {}
    for i, sentence in enumerate(sentences):
        for word in sentence.lower().split():
            if word in word_frequencies:
                if i not in sentence_scores:
                    sentence_scores[i] = word_frequencies[word]
                else:
                    sentence_scores[i] += word_frequencies[word]
    
    # Get top 30% of sentences
    top_n = max(int(len(sentences) * 0.3), 3)  # At least 3 sentences
    top_sentences = sorted(sentence_scores.items(), key=lambda x: x[1], reverse=True)[:top_n]
    top_sentences = [sentences[i] for i, _ in sorted(top_sentences)]
    
    return top_sentences

# Improved function to generate exam-style questions from text
def generate_flashcards(summarized_text):
    flashcards = []
    
    # Question templates for different types of content
    definition_templates = [
        "Define the term {}.",
        "What is {}?",
        "Explain the concept of {}.",
        "What does {} mean in this context?",
        "Describe what {} refers to."
    ]
    
    process_templates = [
        "Explain the process of {}.",
        "How does {} work?",
        "What are the steps involved in {}?",
        "Describe how {} happens.",
        "Outline the procedure for {}."
    ]
    
    comparison_templates = [
        "Compare and contrast {} and {}.",
        "What is the difference between {} and {}?",
        "How are {} and {} related?",
        "Distinguish between {} and {}.",
        "What similarities exist between {} and {}?"
    ]
    
    cause_effect_templates = [
        "What causes {}?",
        "What are the effects of {}?",
        "What is the relationship between {} and {}?",
        "How does {} impact {}?",
        "What happens when {}?"
    ]
    
    application_templates = [
        "How is {} applied in real-world situations?",
        "Give an example of {} in practice.",
        "How would you use {} to solve a problem?",
        "What is a practical application of {}?",
        "In what situation would {} be useful?"
    ]
    
    for sentence in summarized_text:
        # Skip short sentences
        if len(sentence.split()) < 5:
            continue
            
        words = sentence.split()
        
        # Find potential keywords (longer words, avoiding common stopwords)
        stopwords = ["the", "and", "that", "this", "with", "from", "their", "have", "for", "not", "are", "but"]
        keywords = [word.strip('.,?!()[]{}":;').lower() for word in words 
                  if len(word) > 4 and word.lower() not in stopwords and word.isalpha()]
        
        if not keywords:
            continue
            
        # Choose a keyword for the question
        keyword = random.choice(keywords) if len(keywords) > 1 else keywords[0]
        
        # Determine the type of question based on sentence structure and content
        question = ""
        
        # Check for definition patterns
        if " is " in sentence.lower() or " are " in sentence.lower() or " refers to " in sentence.lower():
            template = random.choice(definition_templates)
            question = template.format(keyword)
        
        # Check for process patterns
        elif "process" in sentence.lower() or "procedure" in sentence.lower() or "steps" in sentence.lower() or "method" in sentence.lower():
            template = random.choice(process_templates)
            question = template.format(keyword)
        
        # Check for comparison patterns
        elif " than " in sentence.lower() or " versus " in sentence.lower() or " compared to " in sentence.lower() or " while " in sentence.lower():
            if len(keywords) >= 2:
                template = random.choice(comparison_templates)
                question = template.format(keywords[0], keywords[1])
            else:
                template = random.choice(definition_templates)
                question = template.format(keyword)
        
        # Check for cause-effect patterns
        elif " because " in sentence.lower() or " causes " in sentence.lower() or " results in " in sentence.lower() or " leads to " in sentence.lower():
            if len(keywords) >= 2:
                template = random.choice(cause_effect_templates)
                question = template.format(keywords[0], keywords[1])
            else:
                template = random.choice(cause_effect_templates)
                question = template.format(keyword)
        
        # Default to application questions for more complex sentences
        elif len(sentence.split()) > 15:
            template = random.choice(application_templates)
            question = template.format(keyword)
        
        # Default to definition for shorter sentences
        else:
            template = random.choice(definition_templates)
            question = template.format(keyword)
            
        # Add the flashcard
        flashcards.append({
            "question": question,
            "answer": sentence
        })
        
        # Limit to 12 cards for demonstration
        if len(flashcards) >= 12:
            break
            
    return flashcards

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/api/generate-flashcards', methods=['POST'])
def api_generate_flashcards():
    data = request.json
    text = data.get('text', '')
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
        
    # Summarize the text
    summarized_text = summarize_text(text)
    
    # Generate flashcards from the summary
    flashcards = generate_flashcards(summarized_text)
    
    return jsonify({
        'flashcards': flashcards
    })

# Additional endpoints for saving and loading decks if you want to use server-side storage
@app.route('/api/decks', methods=['GET'])
def get_decks():
    conn = sqlite3.connect('memorize.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT * FROM decks ORDER BY created_at DESC')
    decks = [dict(row) for row in c.fetchall()]
    conn.close()
    
    # Parse JSON cards
    for deck in decks:
        deck['cards'] = json.loads(deck['cards'])
        
    return jsonify(decks)

@app.route('/api/decks', methods=['POST'])
def save_deck():
    data = request.json
    name = data.get('name', '')
    cards = data.get('cards', [])
    
    if not name or not cards:
        return jsonify({'error': 'Name and cards are required'}), 400
        
    conn = sqlite3.connect('memorize.db')
    c = conn.cursor()
    c.execute(
        'INSERT INTO decks (name, cards, created_at) VALUES (?, ?, ?)',
        (name, json.dumps(cards), datetime.now().isoformat())
    )
    deck_id = c.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({
        'id': deck_id,
        'name': name,
        'cards': cards,
        'created_at': datetime.now().isoformat()
    })

@app.route('/api/decks/<int:deck_id>', methods=['DELETE'])
def delete_deck(deck_id):
    conn = sqlite3.connect('memorize.db')
    c = conn.cursor()
    c.execute('DELETE FROM decks WHERE id = ?', (deck_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

if __name__ == '__main__':
    init_db()
    app.run(debug=True)