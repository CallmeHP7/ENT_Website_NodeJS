from flask import Flask, render_template, redirect, url_for, request, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user

app = Flask(__name__)
app.secret_key = "your_secret_key"

# Database Configuration
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///clinic.db"
db = SQLAlchemy(app)

# User Login Management
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

# User Model
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)

# Doctor Model
class Doctor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    specialization = db.Column(db.String(100), nullable=False)
    available_slots = db.Column(db.String(200), nullable=False)  # Example: "10:00 AM, 11:00 AM"

# Appointment Model
class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctor.id"), nullable=False)
    time_slot = db.Column(db.String(50), nullable=False)
    prescription = db.Column(db.String(500), nullable=True)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Home Page
@app.route("/")
def home():
    return render_template("index.html")

# Login Page
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        user = User.query.filter_by(username=username, password=password).first()
        if user:
            login_user(user)
            return redirect(url_for("dashboard"))
        return "Invalid Credentials"
    return render_template("login.html")

# Dashboard
@app.route("/dashboard")
@login_required
def dashboard():
    doctors = Doctor.query.all()
    return render_template("dashboard.html", doctors=doctors)

# Book Appointment
@app.route("/book", methods=["POST"])
@login_required
def book():
    doctor_id = request.form["doctor_id"]
    time_slot = request.form["time_slot"]
    appointment = Appointment(user_id=current_user.id, doctor_id=doctor_id, time_slot=time_slot)
    db.session.add(appointment)
    db.session.commit()
    return redirect(url_for("dashboard"))

# View Prescriptions
@app.route("/prescription")
@login_required
def prescription():
    appointments = Appointment.query.filter_by(user_id=current_user.id).all()
    return render_template("prescription.html", appointments=appointments)

# Logout
@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))

if __name__ == "__main__":
    db.create_all()
    app.run(debug=True)
