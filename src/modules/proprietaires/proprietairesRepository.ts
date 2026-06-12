import db from '../../config/db';

export const findAll = async () => {
  return db('owners')
    .join('users', 'owners.user_id', 'users.id')
    .select('owners.*', 'users.email', 'users.first_name', 'users.last_name');
};

export const findById = async (id: number) => {
  return db('owners')
    .join('users', 'owners.user_id', 'users.id')
    .where('owners.id', id)
    .select('owners.*', 'users.email', 'users.first_name', 'users.last_name')
    .first();
};

export const create = async (data: any) => {
  const [id] = await db('owners').insert(data);
  return id;
};

export const update = async (id: number, data: any) => {
  return db('owners').where({ id }).update(data);
};

export const remove = async (id: number) => {
  return db('owners').where({ id }).del();
};
