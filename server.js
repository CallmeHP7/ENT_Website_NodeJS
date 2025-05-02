const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// ✅ **MongoDB Connection**
mongoose
  .connect("mongodb://localhost:27017/Signup", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// ✅ **Multer Setup for File Uploads**
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// ✅ **Patient Schema**
const PatientSchema = new mongoose.Schema({
  name: String,
  mobile: String,
  email: { type: String, unique: true },
  address: String,
  gender: String,
  dob: String,
  password: String,
  photo: String,
  aadhar: { type: String },
  patientId: { type: Number, unique: true },
});
const Patient = mongoose.model("Patient", PatientSchema);

// ✅ **Doctor Schema**
const DoctorSchema = new mongoose.Schema({
  name: String,
  mobile: String,
  email: { type: String, unique: true },
  address: String,
  gender: String,
  dob: String,
  specialization: String,
  license: String,
  experience: Number,
  password: String,
  photo: String,
});
const Doctor = mongoose.model("Doctor", DoctorSchema);

// ✅ **Appointment Schema** (Modified to include 'time')
const AppointmentSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
  date: String,
  time: String, // <-- New field added
  status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" },
});
const Appointment = mongoose.model("Appointment", AppointmentSchema);

// ------------------ New Schemas ------------------

// ✅ **Prescription Schema**
const PrescriptionSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
  medicines: [{
    medicine: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  date: { type: Date, default: Date.now }
});
const Prescription = mongoose.model("Prescription", PrescriptionSchema);

// ✅ **Medical Test Schema**
const MedicalTestSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
  tests: [{
    testName: String,
    notes: String
  }],
  date: { type: Date, default: Date.now }
});
const MedicalTest = mongoose.model("MedicalTest", MedicalTestSchema);
// ——— QUERY SCHEMA ———
const QuerySchema = new mongoose.Schema({
  name:      String,
  email:     String,
  message:   String,
  status:    { type: String, default: 'new' },
  createdAt: { type: Date,   default: Date.now }
});
const Query = mongoose.model('Query', QuerySchema);
// ———————————————————


// ------------------ End New Schemas ------------------

// ✅ **JWT Authentication Middleware**
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ message: "Access denied! No token provided." });
  try {
    const decoded = jwt.verify(token.split(" ")[1], "your_jwt_secret");
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token!" });
  }
};

// ✅ **API Routes**

// 👉 **Patient Routes**
app.post("/signup", upload.single("photo"), (req, res) => handleSignup(req, res, Patient));
app.post("/login", (req, res) => handleLogin(req, res, Patient));
app.get("/profile", verifyToken, (req, res) => handleProfile(req, res, Patient));

// 👉 **Doctor Routes**
app.post("/doctor-signup", upload.single("photo"), (req, res) => handleSignup(req, res, Doctor));
app.post("/doctor/login", (req, res) => handleLogin(req, res, Doctor));
app.get("/doctor/profile", verifyToken, (req, res) => handleProfile(req, res, Doctor));

// ✅ Get All Doctors for Dropdown
app.get("/doctors", async (req, res) => {
  try {
    const doctors = await Doctor.find({}, "name");
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ **New API: Create Appointment Request** (Modified to store 'time')
app.post("/appointments", verifyToken, async (req, res) => {
  try {
    const { doctorId, date, time } = req.body; // now including time
    const appointment = new Appointment({
      doctorId,
      patientId: req.user.id,
      date,
      time,
    });
    await appointment.save();
    res.json({ message: "Appointment requested successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ **New API: Get Patient's Own Appointments**
app.get("/appointments/mine", verifyToken, async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user.id })
      .populate("doctorId", "name") // populate doctor name
      .exec();
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ **New API: Get Doctor's Appointments**
app.get("/doctor/appointments", verifyToken, async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.user.id })
      .populate("patientId", "name dob gender address mobile email")
      .exec();
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ **New API: Accept/Reject Appointment**
app.post("/doctor/appointments/:id/status", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    appointment.status = status;
    await appointment.save();
    res.json({ message: `Appointment ${status.toLowerCase()} successfully!` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ **New API: Get Doctor's Patient History**
app.get("/doctor/patients", verifyToken, async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.user.id, status: "Accepted" })
      .populate("patientId", "name dob gender address mobile email aadhar patientId")
      .exec();
    const patientHistory = appointments.map((appt) => appt.patientId);
    res.json(patientHistory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ------------------ New Endpoints ------------------

// Prescription Endpoints

// Doctor adds a prescription
app.post("/doctor/prescription", verifyToken, async (req, res) => {
  try {
    const { patientId, medicines } = req.body; // 'medicines' should be an array of objects
    const prescription = new Prescription({
      doctorId: req.user.id,
      patientId,
      medicines
    });
    await prescription.save();
    res.json({ message: "Prescription saved successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Patient fetches their prescriptions
app.get("/patient/prescriptions", verifyToken, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.user.id })
      .populate("doctorId", "name license")
      .populate("patientId", "name patientId") // <--- ADD THIS LINE
      .exec();
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Medical Test Endpoints

// Doctor adds a medical test record
app.post("/doctor/medicaltest", verifyToken, async (req, res) => {
  try {
    const { patientId, tests } = req.body; // 'tests' should be an array of objects
    const medicalTest = new MedicalTest({
      doctorId: req.user.id,
      patientId,
      tests
    });
    await medicalTest.save();
    res.json({ message: "Medical test record saved successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Patient fetches their medical tests
app.get("/patient/medicaltests", verifyToken, async (req, res) => {
  try {
    const tests = await MedicalTest.find({ patientId: req.user.id })
      .populate("doctorId", "name license")
      .exec();
    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ------------------ End New Endpoints ------------------

// NEW ENDPOINT: Get a Patient by custom patientId
app.get("/doctor/getPatientByCustomId", verifyToken, async (req, res) => {
  try {
    const customId = req.query.patientId; // Expecting the custom patientId as a query parameter
    const patient = await Patient.findOne({ patientId: customId });
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ——— ADMIN DATA ROUTES ———

// ——— Admin: Get ALL doctor details ———
app.get('/doctors/all', verifyToken, async (req, res) => {
  try {
    const docs = await Doctor.find()
      .select('name email specialization license');
    res.json(docs);
  } catch (err) {
    console.error('[/doctors/all] error:', err);
    res.status(500).json({ error: err.message });
  }
});
// ——————————————————————————————


// 2) Get all patients
app.get('/patients', verifyToken, async (req, res) => {
  try {
    // MUST return fields: name, mobile, dob, aadhar, patientId
    const patients = await Patient.find()
      .select('name mobile dob aadhar patientId');
    res.json(patients);
  } catch (err) {
    console.error('[/patients] error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3) Get all appointments
app.get('/appointments/all', verifyToken, async (req, res) => {
  try {
    // You can populate names for clarity
    const appts = await Appointment.find()
      .populate('doctorId', 'name')
      .populate('patientId', 'name');
    res.json(appts);
  } catch (err) {
    console.error('[/appointments/all] error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4) Get all “new” queries
app.get('/queries/new', verifyToken, async (req, res) => {
  try {
    const newQueries = await Query.find({ status: 'new' })
      .select('name email message createdAt');
    res.json(newQueries);
  } catch (err) {
    console.error('[/queries/new] error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ——————————————————————
// ✅ **Start the Server**
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// ✅ **Helper Functions**

async function handleSignup(req, res, User) {
  try {
    const { email, password, aadhar } = req.body; // Include aadhar here
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists!" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const photoPath = req.file ? `/uploads/${req.file.filename}` : "";
    // Only assign a patientId if this is the Patient model
    let extraFields = {};
    if (User.modelName === "Patient") {
      const lastPatient = await User.findOne().sort({ patientId: -1 });
      let newPatientId = 1001;
      if (lastPatient && lastPatient.patientId) {
        newPatientId = lastPatient.patientId + 1;
      }
      extraFields = {
        aadhar: aadhar,
        patientId: newPatientId,
      };
    }
    const newUser = new User({
      ...req.body,
      password: hashedPassword,
      photo: photoPath,
      ...extraFields,
    });
    await newUser.save();
    res.json({ message: "✅ Signup successful!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function handleLogin(req, res, User) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password!" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password!" });
    const token = jwt.sign({ id: user._id, email: user.email }, "your_jwt_secret", { expiresIn: "1h" });
    res.json({ message: "✅ Login successful!", token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function handleProfile(req, res, User) {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
}
