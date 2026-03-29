const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const { apiLimiter } = require("./middlewares/rateLimit");
const errorHandler = require("./middlewares/error");

const app = express();

// ================= CONFIG =================

// รองรับ proxy (docker / nginx / cloudflare)
app.set("trust proxy", 1);

// ================= GLOBAL MIDDLEWARE =================

// Security headers (กัน XSS, clickjacking ฯลฯ)
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// เปิด CORS (กำหนด origin ผ่าน .env)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

// log request (debug / monitoring)
app.use(morgan("dev"));

// จำกัดขนาด request body
app.use(express.json({ limit: "10kb" }));

// ป้องกัน spam / brute force (ใช้กับทุก /api)
app.use("/api", apiLimiter);

// ================= SWAGGER (เฉพาะ dev) =================

if (process.env.NODE_ENV !== "production") {
  const swaggerOptions = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "User Management API",
        version: "1.0.0",
        description:
          "RESTful API with JWT Authentication, RBAC, Pagination and Filtering",
      },
      servers: [
        {
          url: process.env.BASE_URL || "http://localhost:3000",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
    apis: ["./src/routes/*.js"],
  };

  const swaggerSpec = swaggerJsdoc(swaggerOptions);

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// ================= ROUTES =================

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const adminRoutes = require("./routes/admin.routes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
// ================= HEALTH CHECK =================

// สำหรับ docker / k8s
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// หน้า root
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API running",
    timestamp: new Date().toISOString(),
  });
});

// ================= NOT FOUND =================

// route ไม่ถูกต้อง
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    timestamp: new Date().toISOString(),
  });
});

// ================= ERROR HANDLER =================

// จัดการ error กลางระบบ (ต้องอยู่ล่างสุด)
app.use(errorHandler);

// ================= START SERVER =================

const PORT = process.env.PORT || 3000;

// ไม่ start ตอน test (สำคัญมาก)
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;