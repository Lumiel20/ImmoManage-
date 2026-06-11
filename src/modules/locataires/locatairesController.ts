import { Request, Response } from 'express';
import * as locatairesService from './locatairesService';

export const getAll = async (req: Request, res: Response) => {
  try {
    const data = await locatairesService.getAll();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const data = await locatairesService.getById(Number(req.params.id));
    if (!data) return res.status(404).json({ success: false, error: { message: 'Tenant not found' } });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const id = await locatairesService.create(req.body);
    res.status(201).json({ success: true, data: { id } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    await locatairesService.update(Number(req.params.id), req.body);
    res.json({ success: true, message: 'Tenant updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    await locatairesService.remove(Number(req.params.id));
    res.json({ success: true, message: 'Tenant deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
};

