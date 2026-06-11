import db from '../../config/db';

export const findAll = async () => {
  return db('locataires')
    .join('users', 'locataires.user_id', 'users.id')
    .select('locataires.*', 'users.email', 'users.first_name', 'users.last_name', 'users.phone');
};

export const findById = async (id: number) => {
  return db('locataires')
    .join('users', 'locataires.user_id', 'users.id')
    .where('locataires.id', id)
    .select('locataires.*', 'users.email', 'users.first_name', 'users.last_name', 'users.phone')
    .first();
};

export const create = async (data: any) => {
  const [id] = await db('locataires').insert(data);
  return id;
};

export const update = async (id: number, data: any) => {
  return db('locataires').where({ id }).update(data);
};

export const remove = async (id: number) => {
  return db('locataires').where({ id }).del();
};
