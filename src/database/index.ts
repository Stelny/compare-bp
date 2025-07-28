import sqlite3 from 'sqlite3';
import path from 'path';

export interface Payment {
  id: string;
  paymentId: string;
  gateway: 'stripe' | 'paypal' | 'gopay';
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed';
  customerEmail?: string;
  orderId?: string;
  sessionId?: string;
  createdAt: string;
  updatedAt: string;
}

class Database {
  private db: sqlite3.Database;

  constructor() {
    const dbPath = path.join(process.cwd(), 'payments.db');
    this.db = new sqlite3.Database(dbPath);
    this.init();
  }

  private init(): void {
    this.db.serialize(() => {
      // Create payments table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS payments (
          id TEXT PRIMARY KEY,
          payment_id TEXT NOT NULL,
          gateway TEXT NOT NULL,
          amount INTEGER NOT NULL,
          currency TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          customer_email TEXT,
          order_id TEXT,
          session_id TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);

      // Create indexes
      this.db.run('CREATE INDEX IF NOT EXISTS idx_payment_id ON payments(payment_id)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_session_id ON payments(session_id)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_status ON payments(status)');
    });
  }

  async createPayment(payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = `${payment.gateway}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      this.db.run(
        `INSERT INTO payments (id, payment_id, gateway, amount, currency, status, customer_email, order_id, session_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, payment.paymentId, payment.gateway, payment.amount, payment.currency, payment.status, 
         payment.customerEmail, payment.orderId, payment.sessionId, now, now],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async updatePaymentStatus(paymentId: string, status: Payment['status']): Promise<void> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      
      this.db.run(
        'UPDATE payments SET status = ?, updated_at = ? WHERE payment_id = ?',
        [status, now, paymentId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async getPaymentBySessionId(sessionId: string): Promise<Payment | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM payments WHERE session_id = ?',
        [sessionId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row ? this.mapRowToPayment(row) : null);
        }
      );
    });
  }

  async getPaymentByPaymentId(paymentId: string): Promise<Payment | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM payments WHERE payment_id = ?',
        [paymentId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row ? this.mapRowToPayment(row) : null);
        }
      );
    });
  }

  async getAllPayments(): Promise<Payment[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM payments ORDER BY created_at DESC',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => this.mapRowToPayment(row)));
        }
      );
    });
  }

  private mapRowToPayment(row: any): Payment {
    return {
      id: row.id,
      paymentId: row.payment_id,
      gateway: row.gateway as Payment['gateway'],
      amount: row.amount,
      currency: row.currency,
      status: row.status as Payment['status'],
      customerEmail: row.customer_email,
      orderId: row.order_id,
      sessionId: row.session_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  close(): void {
    this.db.close();
  }
}

export const database = new Database(); 