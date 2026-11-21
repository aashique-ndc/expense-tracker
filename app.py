"""
Smart Expense Tracker - Flask Backend
All rights reserved by Md. Ashikur Rahman (1244050)
This project was created with the assistance of Cat AI.
"""

import json
import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# File to store transactions
TRANSACTIONS_FILE = 'transactions.json'

# Initialize transactions file if it doesn't exist
def init_transactions_file():
    """Create transactions.json file with empty list if it doesn't exist"""
    if not os.path.exists(TRANSACTIONS_FILE):
        with open(TRANSACTIONS_FILE, 'w') as f:
            json.dump([], f)

def load_transactions():
    """Load all transactions from JSON file"""
    try:
        with open(TRANSACTIONS_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def save_transactions(transactions):
    """Save transactions to JSON file"""
    with open(TRANSACTIONS_FILE, 'w') as f:
        json.dump(transactions, f, indent=2)

def generate_id(transactions):
    """Generate a unique ID for new transactions"""
    if not transactions:
        return 1
    return max(t.get('id', 0) for t in transactions) + 1

def validate_transaction(data):
    """Validate transaction data"""
    required_fields = ['title', 'amount', 'date', 'type', 'category']
    
    # Check required fields
    for field in required_fields:
        if field not in data or not data[field]:
            return False, f"{field} is required"
    
    # Validate amount
    try:
        amount = float(data['amount'])
        if amount <= 0:
            return False, "Amount must be greater than 0"
    except ValueError:
        return False, "Invalid amount format"
    
    # Validate type
    if data['type'] not in ['income', 'expense']:
        return False, "Type must be income or expense"
    
    # Validate date
    try:
        datetime.strptime(data['date'], '%Y-%m-%d')
    except ValueError:
        return False, "Invalid date format. Use YYYY-MM-DD"
    
    return True, ""

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Get all transactions"""
    init_transactions_file()
    transactions = load_transactions()
    return jsonify(transactions)

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    """Add a new transaction"""
    init_transactions_file()
    data = request.json
    
    # Validate data
    is_valid, error_message = validate_transaction(data)
    if not is_valid:
        return jsonify({'error': error_message}), 400
    
    transactions = load_transactions()
    
    # Add unique ID and timestamp
    new_transaction = {
        'id': generate_id(transactions),
        'title': data['title'].strip(),
        'amount': float(data['amount']),
        'date': data['date'],
        'type': data['type'],
        'category': data['category'].strip(),
        'notes': data.get('notes', '').strip(),
        'created_at': datetime.now().isoformat()
    }
    
    transactions.append(new_transaction)
    save_transactions(transactions)
    return jsonify(new_transaction), 201

@app.route('/api/transactions/<int:transaction_id>', methods=['PUT'])
def update_transaction(transaction_id):
    """Update an existing transaction"""
    init_transactions_file()
    data = request.json
    
    # Validate data
    is_valid, error_message = validate_transaction(data)
    if not is_valid:
        return jsonify({'error': error_message}), 400
    
    transactions = load_transactions()
    
    # Find the transaction
    for i, transaction in enumerate(transactions):
        if transaction.get('id') == transaction_id:
            # Update fields
            transactions[i]['title'] = data['title'].strip()
            transactions[i]['amount'] = float(data['amount'])
            transactions[i]['date'] = data['date']
            transactions[i]['type'] = data['type']
            transactions[i]['category'] = data['category'].strip()
            transactions[i]['notes'] = data.get('notes', '').strip()
            transactions[i]['updated_at'] = datetime.now().isoformat()
            
            save_transactions(transactions)
            return jsonify(transactions[i])
    
    return jsonify({'error': 'Transaction not found'}), 404

@app.route('/api/transactions/<int:transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    """Delete a transaction"""
    init_transactions_file()
    transactions = load_transactions()
    
    # Find and remove the transaction
    for i, transaction in enumerate(transactions):
        if transaction.get('id') == transaction_id:
            deleted = transactions.pop(i)
            save_transactions(transactions)
            return jsonify({'message': 'Transaction deleted successfully'})
    
    return jsonify({'error': 'Transaction not found'}), 404

@app.route('/api/transactions/<int:transaction_id>', methods=['GET'])
def get_transaction(transaction_id):
    """Get a single transaction by ID"""
    init_transactions_file()
    transactions = load_transactions()
    
    for transaction in transactions:
        if transaction.get('id') == transaction_id:
            return jsonify(transaction)
    
    return jsonify({'error': 'Transaction not found'}), 404

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    init_transactions_file()
    app.run(debug=True, host='0.0.0.0', port=5000)