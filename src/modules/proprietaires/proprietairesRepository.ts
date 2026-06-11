import db from '../../config/db';

export const findAll = async () => {
  return db('proprietaires')
    .join('users', 'proprietaires.user_id', 'users.id')
    .select('proprietaires.*', 'users.email', 'users.first_name', 'users.last_name');
};

export const findById = async (id: number) => {
  return db('proprietaires')
    .join('users', 'proprietaires.user_id', 'users.id')
    .where('proprietaires.id', id)
    .select('proprietaires.*', 'users.email', 'users.first_name', 'users.last_name')
    .first();
};

export const create = async (data: any) => {
  const [id] = await db('proprietaires').insert(data);
  return id;
};

export const update = async (id: number, data: any) => {
  return db('proprietaires').where({ id }).update(data);
};

export const remove = async (id: number) => {
  return db('proprietaires').where({ id }).del();
};
