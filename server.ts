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
    reason: "Manutenção Preventiva dos Equipamentos",
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
    const parsed = JSON.parse(content);
    return {
      reservations: Array.isArray(parsed.reservations) ? parsed.reservations : [],
      blockedDates: Array.isArray(parsed.blockedDates) ? parsed.blockedDates : [],
    };
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

  // CORS and body parser
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    
    // Forçar desativação de cache em todas as rotas de API para sincronização em tempo real
    if (req.originalUrl.startsWith("/api") || req.url.startsWith("/api")) {
      res.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.header("Pragma", "no-cache");
      res.header("Expires", "0");
    }

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // API Router
  const apiRouter = express.Router();

  // GET All Data
  apiRouter.get("/data", (req, res) => {
    try {
      const data = readDB();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: "Erro ao ler banco de dados." });
    }
  });

  // GET Reservations
  apiRouter.get("/reservations", (req, res) => {
    try {
      const data = readDB();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: "Erro ao ler reservas." });
    }
  });

  // POST Add Reservations
  apiRouter.post("/reservations", (req, res) => {
    try {
      const body = req.body;
      if (!body) {
        return res.status(400).json({ error: "Dados da reserva ausentes." });
      }

      const newItems: Reservation[] = Array.isArray(body) ? body : [body];

      if (newItems.length === 0) {
        return res.status(400).json({ error: "Nenhuma reserva fornecida." });
      }

      const db = readDB();

      // Check for conflicts
      for (const item of newItems) {
        const conflict = db.reservations.some(
          (r) =>
            r.resourceId === item.resourceId &&
            r.date === item.date &&
            r.periodId === item.periodId &&
            r.id !== item.id
        );
        if (conflict) {
          return res.status(409).json({
            error:
              "Um ou mais horários selecionados já estão reservados para este recurso por outro professor.",
          });
        }
      }

      db.reservations.push(...newItems);
      writeDB(db);
      res.json(db);
    } catch (err: any) {
      console.error("Error in POST /api/reservations:", err);
      res.status(500).json({ error: "Erro interno ao registrar reserva." });
    }
  });

  // POST or DELETE Reservations Delete
  const handleReservationsDelete = (req: express.Request, res: express.Response) => {
    try {
      const ids = req.body?.ids || (req.body ? [req.body.id].filter(Boolean) : []);
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Lista de IDs inválida." });
      }

      const db = readDB();
      db.reservations = db.reservations.filter((r) => !ids.includes(r.id));
      writeDB(db);
      res.json(db);
    } catch (err: any) {
      console.error("Error in delete reservations:", err);
      res.status(500).json({ error: "Erro interno ao excluir reserva." });
    }
  };

  apiRouter.post("/reservations/delete", handleReservationsDelete);
  apiRouter.delete("/reservations", handleReservationsDelete);

  // GET Blocked Dates
  apiRouter.get("/blocked-dates", (req, res) => {
    try {
      const data = readDB();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: "Erro ao ler datas bloqueadas." });
    }
  });

  // POST Add Blocked Dates
  apiRouter.post("/blocked-dates", (req, res) => {
    try {
      const body = req.body;
      const newBlocks: BlockedDate[] = Array.isArray(body) ? body : [body];

      const db = readDB();
      db.blockedDates.push(...newBlocks);
      writeDB(db);
      res.json(db);
    } catch (err: any) {
      console.error("Error in POST /api/blocked-dates:", err);
      res.status(500).json({ error: "Erro interno ao bloquear datas." });
    }
  });

  // POST or DELETE Blocked Date Delete
  const handleBlockedDateDelete = (req: express.Request, res: express.Response) => {
    try {
      const id = req.params.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: "ID do bloqueio não fornecido." });
      }
      const db = readDB();
      db.blockedDates = db.blockedDates.filter((b) => b.id !== id);
      writeDB(db);
      res.json(db);
    } catch (err: any) {
      console.error("Error in delete blocked-date:", err);
      res.status(500).json({ error: "Erro interno ao desbloquear data." });
    }
  };

  apiRouter.post("/blocked-dates/delete", handleBlockedDateDelete);
  apiRouter.delete("/blocked-dates/:id", handleBlockedDateDelete);

  // Mount API router
  app.use("/api", apiRouter);

  // Catch-all for /api/* to prevent falling through to Vite (which causes 405 Method Not Allowed)
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: "Endpoint de API não encontrado." });
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
