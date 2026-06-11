import * as locatairesRepository from './locatairesRepository';
import db from '../../config/db';
import bcrypt from 'bcryptjs';

export const getAll = async () => {
  return locatairesRepository.findAll();
};

export const getById = async (id: number) => {
  return locatairesRepository.findById(id);
};

export const create = async (data: any) => {
  const { email, first_name, last_name, phone, profession, revenu_mensuel, cni_numero } = data;
  
  return db.transaction(async (trx) => {
    // 1. Create user
    const passwordHash = await bcrypt.hash('tenant123', 12);
    const [userId] = await trx('users').insert({
      email,
      password_hash: passwordHash,
      role: 'locataire',
      first_name,
      last_name,
      phone,
      is_active: true
    });

    // 2. Create locataire linked to user
    const [locataireId] = await trx('locataires').insert({
      user_id: userId,
      profession,
      revenu_mensuel: Number(revenu_mensuel) || 0,
      cni_numero
    });

    return locataireId;
  });
};

export const update = async (id: number, data: any) => {
  const { email, first_name, last_name, phone, profession, revenu_mensuel, cni_numero } = data;
  
  return db.transaction(async (trx) => {
    // Find locataire to get user_id
    const locataire = await trx('locataires').where({ id }).first();
    if (!locataire) {
      throw new Error('Tenant not found');
    }

    // Update user table
    await trx('users').where({ id: locataire.user_id }).update({
      email,
      first_name,
      last_name,
      phone
    });

    // Update locataires table
    await trx('locataires').where({ id }).update({
      profession,
      revenu_mensuel: Number(revenu_mensuel) || 0,
      cni_numero
    });
  });
};

export const remove = async (id: number) => {
  return db.transaction(async (trx) => {
    const locataire = await trx('locataires').where({ id }).first();
    if (!locataire) {
      throw new Error('Tenant not found');
    }

    // Delete locataire first then user
    await trx('locataires').where({ id }).del();
    await trx('users').where({ id: locataire.user_id }).del();
  });
};

