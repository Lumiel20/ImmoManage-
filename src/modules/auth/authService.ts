import bcrypt from 'bcryptjs';
import * as authRepository from './authRepository';
import { generateToken } from '../../utils/auth';

export const register = async (userData: any) => {
  const hashedPassword = await bcrypt.hash(userData.password, 12);
  const userToCreate = {
    email: userData.email,
    password_hash: hashedPassword,
    first_name: userData.first_name,
    last_name: userData.last_name,
    role: userData.role || 'locataire',
  };
  const userId = await authRepository.createUser(userToCreate);
  const user = await authRepository.findUserById(userId);
  const token = generateToken({ id: user.id, role: user.role });
  return { user, token };
};

export const login = async (credentials: any) => {
  const user = await authRepository.findUserByEmail(credentials.email);
  if (!user) throw new Error('Invalid credentials');

  const isMatch = await bcrypt.compare(credentials.password, user.password_hash);
  if (!isMatch) throw new Error('Invalid credentials');

  const token = generateToken({ id: user.id, role: user.role });
  return { user, token };
};

export const firebaseSync = async (data: { email: string; first_name?: string; last_name?: string }) => {
  let user = await authRepository.findUserByEmail(data.email);
  if (!user) {
    const userToCreate = {
      email: data.email,
      password_hash: 'EXTERNAL_FIREBASE_USER',
      first_name: data.first_name || data.email.split('@')[0],
      last_name: data.last_name || '',
      role: 'agent', // Assign 'agent' role by default so they can manage contracts
    };
    const userId = await authRepository.createUser(userToCreate);
    user = await authRepository.findUserById(userId);
  } else if (user.role === 'locataire') {
    // Promote user role to 'agent' to ensure they have permission to access management endpoints
    await authRepository.updateUser(user.id, { role: 'agent' });
    user = await authRepository.findUserById(user.id);
  }
  const token = generateToken({ id: user.id, role: user.role });
  return { user, token };
};

