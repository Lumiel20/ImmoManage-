import { Request, Response } from 'express';
import * as biensService from './biensService';

export const getAll = async (req: Request, res: Response) => {
  try {
    const data = await biensService.getAllBiens(req.query);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const data = await biensService.getBienById(Number(req.params.id));
    if (!data) return res.status(404).json({ success: false, error: { message: 'Not found' } });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const create = async (req: any, res: Response) => {
  try {
    const bienData = { ...req.body, owner_id: req.user.id };
    const id = await biensService.createBien(bienData);
    res.status(201).json({ success: true, data: { id } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    await biensService.updateBien(Number(req.params.id), req.body);
    res.json({ success: true, message: 'Property updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    await biensService.deleteBien(Number(req.params.id));
    res.json({ success: true, message: 'Property deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
};

