import db from '../../config/db';

export const findUserByEmail = async (email: string) => {
  return db('users').where({ email }).first();
};

export const createUser = async (userData: any) => {
  const [id] = await db('users').insert(userData);
  return id;
};

export const findUserById = async (id: number) => {
  return db('users').where({ id }).first();
};

export const updateUser = async (id: number, data: any) => {
  return db('users').where({ id }).update(data);
};
