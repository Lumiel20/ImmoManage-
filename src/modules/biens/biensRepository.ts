import db from '../../config/db';

export const findAll = async (filters: any) => {
  let query = db('properties');
  if (filters.type) query = query.where({ type: filters.type });
  if (filters.ville) query = query.where({ ville: filters.ville });
  if (filters.minPrix) query = query.where('prix', '>=', filters.minPrix);
  if (filters.maxPrix) query = query.where('prix', '<=', filters.maxPrix);
  return query.select('*');
};

export const findById = async (id: number) => {
  return db('properties').where({ id }).first();
};

export const create = async (bienData: any) => {
  const [id] = await db('properties').insert(bienData);
  return id;
};

export const update = async (id: number, bienData: any) => {
  return db('properties').where({ id }).update(bienData);
};

export const remove = async (id: number) => {
  return db('properties').where({ id }).del();
};
