from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Configure SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

# User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    mobile = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

# Create database tables
with app.app_context():
    db.create_all()

# Signup Route
@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    existing_user = User.query.filter_by(email=data['email']).first()
    
    if existing_user:
        return jsonify({'success': False, 'message': 'User already exists'})

    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = User(name=data['name'], mobile=data['mobile'], email=data['email'], password=hashed_password)
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Signup successful!'})

# Login Route
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()

    if user and bcrypt.check_password_hash(user.password, data['password']):
        return jsonify({'success': True, 'message': 'Login successful'})
    
    return jsonify({'success': False, 'message': 'Invalid credentials'})

if __name__ == '__main__':
    app.run(debug=True)
