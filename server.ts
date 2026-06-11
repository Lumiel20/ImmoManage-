import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import morgan from "morgan";
import bcrypt from "bcryptjs";
import helmet from "helmet";
import db from "./src/config/db";
import authRoutes from './src/modules/auth/authRoutes';
import biensRoutes from './src/modules/biens/biensRoutes';
import contratsRoutes from './src/modules/contrats/contratsRoutes';
import proprietairesRoutes from './src/modules/proprietaires/proprietairesRoutes';
import locatairesRoutes from './src/modules/locataires/locatairesRoutes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());
  app.use(morgan("dev"));
  app.use(helmet({
    contentSecurityPolicy: false, // For easier dev with Vite
  }));

  // Ensure DB connection and run migrations
  const setupDb = async () => {
    try {
      if (!(await db.schema.hasTable('users'))) {
        await db.schema.createTable('users', (table) => {
          table.increments('id').primary();
          table.string('email').unique().notNullable();
          table.string('password_hash').notNullable();
          table.string('role').notNullable().defaultTo('locataire');
          table.string('first_name');
          table.string('last_name');
          table.string('phone');
          table.boolean('is_active').defaultTo(true);
          table.timestamps(true, true);
        });
        
        // Seed initial admin if created
        await db('users').insert({
          email: 'admin@example.com',
          password_hash: await bcrypt.hash('password123', 12),
          role: 'admin',
          first_name: 'Admin',
          last_name: 'System'
        });
        console.log("Table 'users' created and seeded.");
      }

      if (!(await db.schema.hasTable('biens'))) {
        await db.schema.createTable('biens', (table) => {
          table.increments('id').primary();
          table.string('titre').notNullable();
          table.text('description');
          table.string('type'); 
          table.string('transaction_type');
          table.float('surface');
          table.integer('nb_pieces');
          table.float('prix');
          table.string('ville');
          table.string('statut').defaultTo('disponible');
          table.float('latitude');
          table.float('longitude');
          table.integer('owner_id').references('id').inTable('users');
          table.timestamps(true, true);
        });

        await db('biens').insert([
          { titre: 'Appartement Haussmannien', surface: 85, nb_pieces: 4, prix: 850000, ville: 'Paris', type: 'appartement', statut: 'disponible', latitude: 48.8566, longitude: 2.3522 },
          { titre: 'Villa contemporaine', surface: 250, nb_pieces: 6, prix: 1200000, ville: 'Nice', type: 'maison', statut: 'disponible', latitude: 43.7102, longitude: 7.2620 },
          { titre: 'Studio étudiant', surface: 20, nb_pieces: 1, prix: 120000, ville: 'Lyon', type: 'appartement', statut: 'vendu', latitude: 45.7640, longitude: 4.8357 },
          { titre: 'Bureau centre-ville', surface: 120, nb_pieces: 5, prix: 3500, ville: 'Bordeaux', type: 'bureau', statut: 'disponible', latitude: 44.8378, longitude: -0.5792 },
        ]);
        console.log("Table 'biens' created and seeded.");
      }

      if (!(await db.schema.hasTable('contrats'))) {
        await db.schema.createTable('contrats', (table) => {
          table.increments('id').primary();
          table.string('type').notNullable(); // bail, vente, mandat
          table.integer('bien_id').references('id').inTable('biens');
          table.integer('locataire_id').references('id').inTable('users');
          table.date('date_debut');
          table.date('date_fin');
          table.float('loyer_mensuel');
          table.float('prix_vente');
          table.string('statut').defaultTo('actif');
          table.timestamps(true, true);
        });

        const biens = await db('biens').select();
        if (biens && biens.length > 0) {
          // Contrat qui expire dans exactement 7 jours (J+7) pour la démo de notification
          await db('contrats').insert({
            type: 'bail',
            bien_id: biens[0].id,
            date_debut: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            date_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            loyer_mensuel: 1250,
            statut: 'actif'
          });

          // Deuxième contrat standard
          if (biens.length > 3) {
            await db('contrats').insert({
              type: 'bail',
              bien_id: biens[3].id,
              date_debut: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              loyer_mensuel: 3500,
              statut: 'actif'
            });
          }
        }
        console.log("Table 'contrats' created and seeded.");
      }

      if (!(await db.schema.hasTable('documents'))) {
        await db.schema.createTable('documents', (table) => {
          table.increments('id').primary();
          table.integer('contrat_id').references('id').inTable('contrats').onDelete('CASCADE');
          table.string('titre').notNullable();
          table.string('type').notNullable(); // bail, quittance, autre
          table.text('url').notNullable();
          table.string('storage_path');
          table.timestamps(true, true);
        });
        console.log("Table 'documents' created.");
      }

      if (!(await db.schema.hasTable('payments'))) {
        await db.schema.createTable('payments', (table) => {
          table.increments('id').primary();
          table.integer('contrat_id').references('id').inTable('contrats').onDelete('CASCADE');
          table.integer('month_index').notNullable(); // 0 to 11
          table.integer('year').notNullable();
          table.float('amount').notNullable();
          table.string('status').notNullable(); // paye, paye_en_retard, retard, attente
          table.string('date_paiement');
          table.string('mode_paiement');
          table.string('confirmed_by');
          table.timestamps(true, true);
          table.unique(['contrat_id', 'month_index', 'year']);
        });
        console.log("Table 'payments' created.");
      }

      if (!(await db.schema.hasTable('proprietaires'))) {
        await db.schema.createTable('proprietaires', (table) => {
          table.increments('id').primary();
          table.integer('user_id').references('id').inTable('users').unique();
          table.string('entreprise');
          table.string('siret');
          table.string('rib');
          table.timestamps(true, true);
        });
        console.log("Table 'proprietaires' created.");
      }

      if (!(await db.schema.hasTable('locataires'))) {
        await db.schema.createTable('locataires', (table) => {
          table.increments('id').primary();
          table.integer('user_id').references('id').inTable('users').unique();
          table.string('profession');
          table.float('revenu_mensuel');
          table.string('cni_numero');
          table.timestamps(true, true);
        });
        console.log("Table 'locataires' created.");

        // Seed some owners and tenants
        const admin = await db('users').where({ role: 'admin' }).first();
        if (admin) {
          const ownerExists = await db('proprietaires').where({ user_id: admin.id }).first();
          if (!ownerExists) {
            await db('proprietaires').insert({
              user_id: admin.id,
              entreprise: 'ImmoTech Solutions',
              siret: '12345678900011',
              rib: 'FR76 1234 5678 9012 3456 7890 123'
            });
          }
        }

        // Seed some locataires
        let tenantUser = await db('users').where({ email: 'jean.dupont@test.fr' }).first();
        let tenantUserId;
        if (!tenantUser) {
          const dummyUser = await db('users').insert({
            email: 'jean.dupont@test.fr',
            password_hash: await bcrypt.hash('tenant123', 12),
            role: 'locataire',
            first_name: 'Jean',
            last_name: 'Dupont'
          });
          tenantUserId = dummyUser[0];
        } else {
          tenantUserId = tenantUser.id;
        }
        
        const locataireExists = await db('locataires').where({ user_id: tenantUserId }).first();
        if (!locataireExists) {
          await db('locataires').insert({
            user_id: tenantUserId,
            profession: 'Ingénieur',
            revenu_mensuel: 3500,
            cni_numero: 'ABC123456'
          });
        }

        console.log("Locataires seeded.");
      }
    } catch (error) {
      console.error("Database setup failed:", error);
    }
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", database: "sqlite" });
  });

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/biens', biensRoutes);
  app.use('/api/v1/contrats', contratsRoutes);
  app.use('/api/v1/proprietaires', proprietairesRoutes);
  app.use('/api/v1/locataires', locatairesRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Vite in middleware mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Run DB setup after server is listening
    console.log("Initializing database...");
    await setupDb();
    console.log("Database initialization complete.");
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
