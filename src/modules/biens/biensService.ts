import * as biensRepository from './biensRepository';

export const getAllBiens = async (filters: any) => {
  return biensRepository.findAll(filters);
};

export const getBienById = async (id: number) => {
  return biensRepository.findById(id);
};

export const createBien = async (bienData: any) => {
  return biensRepository.create(bienData);
};

export const updateBien = async (id: number, bienData: any) => {
  return biensRepository.update(id, bienData);
};

export const deleteBien = async (id: number) => {
  return biensRepository.remove(id);
};
