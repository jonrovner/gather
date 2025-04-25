"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/server.ts
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
const eventRoutes_1 = __importDefault(require("./routes/eventRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev')); // Using 'dev' format for development
// Routes
app.use('/api/events', eventRoutes_1.default);
// Root route
app.get('/', (req, res) => {
    res.send('Welcome to Gather API 🚀');
});
// MongoDB Connection
mongoose_1.default
    .connect(process.env.MONGO_URI)
    .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => console.log(`🌐 Server running at http://localhost:${PORT}`));
})
    .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
});
