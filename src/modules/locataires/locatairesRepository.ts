import db from '../../config/db';

export const findAll = async () => {
  return db('tenants')
    .join('users', 'tenants.user_id', 'users.id')
    .select('tenants.*', 'users.email', 'users.first_name', 'users.last_name', 'users.phone');
};

export const findById = async (id: number) => {
  return db('tenants')
    .join('users', 'tenants.user_id', 'users.id')
    .where('tenants.id', id)
    .select('tenants.*', 'users.email', 'users.first_name', 'users.last_name', 'users.phone')
    .first();
};

export const create = async (data: any) => {
  const [id] = await db('tenants').insert(data);
  return id;
};

export const update = async (id: number, data: any) => {
  return db('tenants').where({ id }).update(data);
};

export const remove = async (id: number) => {
  return db('tenants').where({ id }).del();
};
