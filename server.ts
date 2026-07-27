import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

interface Reservation {
  id: string;
  resourceId: string;
  teacherName: string;
  subject: string;
  grade: string;
  notes?: string;
  date: string;
  shift: "MANHA" | "TARDE";
  periodId: string;
  periodLabel: string;
  createdAt: string;
}

interface BlockedDate {
  id: string;
  date: string;
  resourceId: string | null;
  reason: string;
  createdBy: string;
}

interface DBData {
  reservations: Reservation[];
  blockedDates: BlockedDate[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

const DEFAULT_BLOCKED_DATES: BlockedDate[] = [
  {
    id: "blk-1",
    date: "2026-08-15",
    resourceId: null,
    reason: "Feriado Municipal - Aniversário da Cidade",
    createdBy: "Direção Escolar",
  },
  {
    id: "blk-2",
    date: "2026-08-20",
    resourceId: "espaco-maker",
    reason: "Manutenção Preventiva das Impressoras 3D",
    createdBy: "Coordenador Maker",
  },
];

const DEFAULT_RESERVATIONS: Reservation[] = [
  {
    id: "res-101",
    resourceId: "chromebook-carrinho-1",
    teacherName: "Prof. Carlos Eduardo",
    subject: "Matemática",
    grade: "8º Ano B",
    notes: "Uso do Khan Academy",
    date: getTodayString(),
    shift: "MANHA",
    periodId: "M1",
    periodLabel: "1ª Aula (07:00 - 07:50)",
    createdAt: new Date().toISOString(),
  },
  {
    id: "res-102",
    resourceId: "chromebook-carrinho-2",
    teacherName: "Prof. Ricardo Santos",
    subject: "Ciências",
    grade: "9º Ano A",
    notes: "Pesquisa sobre ecossistemas",
    date: getTodayString(),
    shift: "MANHA",
    periodId: "M2",
    periodLabel: "2ª Aula (07:50 - 08:40)",
    createdAt: new Date().toISOString(),
  },
  {
    id: "res-103",
    resourceId: "sala-google",
    teacherName: "Profª Ana Paula",
    subject: "Geografia",
    grade: "6º Ano A",
    notes: "Apresentação no Google Apresentações",
    date: getTodayString(),
    shift: "TARDE",
    periodId: "T1",
    periodLabel: "1ª Aula (12:30 - 13:20)",
    createdAt: new Date().toISOString(),
  },
];

function readDB(): DBData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initialData: DBData = {
        reservations: DEFAULT_RESERVATIONS,
        blockedDates: DEFAULT_BLOCKED_DATES,
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
      return initialData;
    }
    const content = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading database file, returning default data:", err);
    return {
      reservations: DEFAULT_RESERVATIONS,
      blockedDates: DEFAULT_BLOCKED_DATES,
    };
  }
}

function writeDB(data: DBData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to database file:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // GET All Data
  app.get("/api/data", (req, res) => {
    const data = readDB();
    res.json(data);
  });

  // POST Add Reservations
  app.post("/api/reservations", (req, res) => {
    const newItems: Reservation[] = Array.isArray(req.body)
      ? req.body
      : [req.body];

    const db = readDB();

    // Check for conflicts
    for (const item of newItems) {
      const conflict = db.reservations.some(
        (r) =>
          r.resourceId === item.resourceId &&
          r.date === item.date &&
          r.periodId === item.periodId
      );
      if (conflict) {
        return res.status(409).json({
          error:
            "Um ou mais horários selecionados já estão reservados por outro professor.",
        });
      }
    }

    db.reservations.push(...newItems);
    writeDB(db);
    res.json(db);
  });

  // DELETE Reservations
  app.delete("/api/reservations", (req, res) => {
    const { ids } = req.body as { ids: string[] };
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: "Lista de IDs inválida." });
    }

    const db = readDB();
    db.reservations = db.reservations.filter((r) => !ids.includes(r.id));
    writeDB(db);
    res.json(db);
  });

  // POST Add Blocked Dates
  app.post("/api/blocked-dates", (req, res) => {
    const newBlocks: BlockedDate[] = Array.isArray(req.body)
      ? req.body
      : [req.body];

    const db = readDB();
    db.blockedDates.push(...newBlocks);
    writeDB(db);
    res.json(db);
  });

  // DELETE Blocked Date by ID
  app.delete("/api/blocked-dates/:id", (req, res) => {
    const { id } = req.params;
    const db = readDB();
    db.blockedDates = db.blockedDates.filter((b) => b.id !== id);
    writeDB(db);
    res.json(db);
  });

  // Vite middleware or production static files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
