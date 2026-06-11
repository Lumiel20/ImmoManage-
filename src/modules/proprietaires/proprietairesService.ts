import * as proprietairesRepository from './proprietairesRepository';

export const getAll = async () => {
  return proprietairesRepository.findAll();
};

export const getById = async (id: number) => {
  return proprietairesRepository.findById(id);
};

export const create = async (data: any) => {
  return proprietairesRepository.create(data);
};

export const update = async (id: number, data: any) => {
  return proprietairesRepository.update(id, data);
};

export const remove = async (id: number) => {
  return proprietairesRepository.remove(id);
};
