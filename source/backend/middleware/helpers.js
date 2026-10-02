const { ZodError } = require("zod");

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Wraps async route handlers so thrown errors reach errorHandler (works on Express 4 and 5)
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Assumes your auth middleware sets req.user = { userId, role }
const requireRole = (...roles) => (req, res, next) => {
  const user = req.user;
  if (!user || !roles.includes(user.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

function parseId(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, "Invalid id");
  return n;
}

// Register last: app.use(errorHandler)
function errorHandler(err, _req, res, _next) {
  const { prisma } = require("../lib/prisma");
  
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Validation failed", details: err.flatten() });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") return res.status(404).json({ error: "Not found" });
    if (err.code === "P2003") {
      return res.status(409).json({ error: "Record is referenced by other data" });
    }
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}

module.exports = { HttpError, asyncHandler, requireRole, parseId, errorHandler };