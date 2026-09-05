import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

interface User {
  username: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'moderator' | 'user';
  createdAt: number;
}

class UserDatabase {
  private dbPath: string;
  private users: Map<string, User>;

  constructor() {
    this.dbPath = path.join(__dirname, '../../data/users.json');
    this.users = new Map();
    this.load();
  }

  private load() {
    try {
      // Create data directory if not exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(this.dbPath)) {
        const data = fs.readFileSync(this.dbPath, 'utf-8');
        const usersArray: User[] = JSON.parse(data);
        
        usersArray.forEach(user => {
          this.users.set(user.username.toLowerCase(), user);
        });
        
        console.log(`✅ Loaded ${this.users.size} users from database`);
      } else {
        // Create empty file
        this.save();
        console.log('✅ Created new user database');
      }
    } catch (error) {
      console.error('❌ Failed to load user database:', error);
      this.users = new Map();
    }
  }

  private save() {
    try {
      const usersArray = Array.from(this.users.values());
      fs.writeFileSync(this.dbPath, JSON.stringify(usersArray, null, 2));
    } catch (error) {
      console.error('❌ Failed to save user database:', error);
    }
  }

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  // Create new user
  createUser(username: string, email: string, password: string, role: 'admin' | 'moderator' | 'user' = 'user'): boolean {
    const usernameLower = username.toLowerCase();
    
    // Check if username already exists
    if (this.users.has(usernameLower)) {
      return false;
    }

    // Check if email already exists
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return false;
      }
    }

    const user: User = {
      username: username,
      email: email,
      passwordHash: this.hashPassword(password),
      role: role,
      createdAt: Date.now()
    };

    this.users.set(usernameLower, user);
    this.save();
    
    console.log(`✅ Created user: ${username} (${email}) - Role: ${role}`);
    return true;
  }

  // Verify user credentials
  verifyUser(username: string, password: string): boolean {
    const user = this.users.get(username.toLowerCase());
    
    if (!user) {
      return false;
    }

    const passwordHash = this.hashPassword(password);
    return user.passwordHash === passwordHash;
  }

  // Get user by username
  getUser(username: string): User | undefined {
    return this.users.get(username.toLowerCase());
  }

  // Get user by email
  getUserByEmail(email: string): User | undefined {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return undefined;
  }

  // Update password
  updatePassword(email: string, newPassword: string): boolean {
    const user = this.getUserByEmail(email);
    
    if (!user) {
      return false;
    }

    user.passwordHash = this.hashPassword(newPassword);
    this.save();
    
    console.log(`✅ Password updated for: ${email}`);
    return true;
  }

  // List all users (for debugging)
  listUsers(): string[] {
    return Array.from(this.users.values()).map(u => `${u.username} (${u.email})`);
  }

  // Update user role
  updateRole(username: string, newRole: 'admin' | 'moderator' | 'user'): boolean {
    const user = this.users.get(username.toLowerCase());
    
    if (!user) {
      return false;
    }

    user.role = newRole;
    this.save();
    
    console.log(`✅ Updated role for ${username}: ${newRole}`);
    return true;
  }

  // Get all users with roles
  getAllUsers(): Array<{ username: string; email: string; role: string; createdAt: number }> {
    return Array.from(this.users.values()).map(u => ({
      username: u.username,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt
    }));
  }
}

export const userDatabase = new UserDatabase();
